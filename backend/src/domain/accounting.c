#include "../../include/domain/accounting.h"

imbs_status_t imbs_accounting_validate_journal(
    imbs_journal_entry_t* entry,
    imbs_error_t* err
) {
    if (!entry) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Journal entry pointer is null.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    if (entry->line_count < 2) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Journal must contain at least two entries (one debit, one credit).");
        return IMBS_ERR_INVALID_ARGUMENT;
    }
    if (entry->line_count > MAX_JOURNAL_LINES) {
        imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Journal line count exceeds capacity.");
        return IMBS_ERR_INVALID_ARGUMENT;
    }

    money_t sum_debits = 0;
    money_t sum_credits = 0;

    for (size_t i = 0; i < entry->line_count; i++) {
        imbs_journal_line_t* line = &entry->lines[i];

        if (line->debit_cents < 0 || line->credit_cents < 0) {
            imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Debit and credit amounts cannot be negative.");
            return IMBS_ERR_INVALID_ARGUMENT;
        }
        if (line->debit_cents == 0 && line->credit_cents == 0) {
            imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Line must have either a debit or credit amount.");
            return IMBS_ERR_INVALID_ARGUMENT;
        }
        if (line->debit_cents > 0 && line->credit_cents > 0) {
            imbs_error_set(err, IMBS_ERR_INVALID_ARGUMENT, "Line cannot have both debit and credit amounts simultaneously.");
            return IMBS_ERR_INVALID_ARGUMENT;
        }

        sum_debits += line->debit_cents;
        sum_credits += line->credit_cents;
    }

    entry->total_debits = sum_debits;
    entry->total_credits = sum_credits;

    if (sum_debits != sum_credits) {
        entry->is_balanced = false;
        imbs_error_set(err, IMBS_ERR_UNBALANCED_JOURNAL, "Unbalanced journal: Total Debits do not equal Total Credits.");
        return IMBS_ERR_UNBALANCED_JOURNAL;
    }

    entry->is_balanced = true;
    return IMBS_OK;
}

