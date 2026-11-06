#ifndef IMBS_DOMAIN_ACCOUNTING_H
#define IMBS_DOMAIN_ACCOUNTING_H

#include "../common.h"

#ifdef __cplusplus
extern "C" {
#endif

#define MAX_JOURNAL_LINES 32

typedef struct {
    char account_id[64];
    char account_code[32];
    char account_name[64];
    money_t debit_cents;
    money_t credit_cents;
    char memo[128];
} imbs_journal_line_t;

typedef struct {
    char entry_number[64];
    char memo[256];
    char source_doc_type[32];
    char source_doc_id[64];
    
    imbs_journal_line_t lines[MAX_JOURNAL_LINES];
    size_t line_count;

    money_t total_debits;
    money_t total_credits;
    bool is_balanced;
} imbs_journal_entry_t;

imbs_status_t imbs_accounting_validate_journal(
    imbs_journal_entry_t* entry,
    imbs_error_t* err
);

#ifdef __cplusplus
}
#endif

#endif /* IMBS_DOMAIN_ACCOUNTING_H */

