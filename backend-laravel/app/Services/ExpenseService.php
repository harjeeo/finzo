<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Expense;
use App\Support\SystemAccountCodes;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ExpenseService
{
    public function __construct(
        private readonly BranchService $branchService,
        private readonly AccountsService $accountsService,
        private readonly JournalService $journalService,
    ) {}

    public function findAll(string $businessId, ?string $branchId = null)
    {
        return Expense::with('branch')
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderByDesc('expense_date')
            ->get();
    }

    public function findOne(string $businessId, string $id): Expense
    {
        $expense = Expense::where('business_id', $businessId)->find($id);

        if (! $expense) {
            throw new HttpException(404, 'Expense not found');
        }

        return $expense;
    }

    private function postExpenseEntry(string $businessId, Expense $expense): void
    {
        $expensesAccount = $this->accountsService->getSystemAccount($businessId, SystemAccountCodes::EXPENSES);
        $cashOrBankAccount = $this->accountsService->getSystemAccount(
            $businessId,
            SystemAccountCodes::paymentModeAccountCode($expense->payment_mode),
        );

        $this->journalService->postEntry($businessId, [
            'sourceType' => 'EXPENSE',
            'sourceId' => $expense->id,
            'narration' => "Expense: {$expense->category}",
            'lines' => [
                ['accountId' => $expensesAccount->id, 'debit' => (float) $expense->amount],
                ['accountId' => $cashOrBankAccount->id, 'credit' => (float) $expense->amount],
            ],
        ]);
    }

    public function create(string $businessId, array $data): Expense
    {
        if (! empty($data['branchId'])) {
            $branch = Branch::where('id', $data['branchId'])->where('business_id', $businessId)->first();
            if (! $branch) {
                throw new HttpException(400, 'Branch not found');
            }
            $branchId = $branch->id;
        } else {
            $branchId = $this->branchService->getOrCreateDefaultBranch($businessId)->id;
        }

        return DB::transaction(function () use ($businessId, $branchId, $data) {
            $expense = Expense::create([
                'business_id' => $businessId,
                'branch_id' => $branchId,
                'category' => $data['category'],
                'amount' => $data['amount'],
                'payment_mode' => $data['paymentMode'] ?? 'CASH',
                'reference' => $data['reference'] ?? null,
                'expense_date' => $data['expenseDate'] ?? now(),
            ]);

            $this->postExpenseEntry($businessId, $expense);

            return $expense;
        });
    }

    public function update(string $businessId, string $id, array $data): Expense
    {
        $expense = $this->findOne($businessId, $id);

        return DB::transaction(function () use ($businessId, $id, $data, $expense) {
            $map = [
                'category' => 'category', 'amount' => 'amount', 'paymentMode' => 'payment_mode',
                'reference' => 'reference', 'expenseDate' => 'expense_date',
            ];
            foreach ($map as $requestKey => $column) {
                if (array_key_exists($requestKey, $data)) {
                    $expense->{$column} = $data[$requestKey];
                }
            }
            $expense->save();

            $this->journalService->removeBySource($businessId, 'EXPENSE', $id);
            $this->postExpenseEntry($businessId, $expense);

            return $expense;
        });
    }

    public function remove(string $businessId, string $id): array
    {
        $expense = $this->findOne($businessId, $id);

        DB::transaction(function () use ($businessId, $id, $expense) {
            $this->journalService->removeBySource($businessId, 'EXPENSE', $id);
            $expense->delete();
        });

        return ['success' => true];
    }
}
