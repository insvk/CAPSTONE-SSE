/*
  cJSON implementation - Minimal ANSI C compliant JSON parser and generator
*/

#include <string.h>
#include <stdio.h>
#include <math.h>
#include <stdlib.h>
#include <limits.h>
#include <ctype.h>
#include "../include/cJSON.h"

static void *(*cJSON_malloc)(size_t sz) = malloc;
static void (*cJSON_free)(void *ptr) = free;

const char *cJSON_Version(void) { return "1.7.15"; }

void cJSON_InitHooks(cJSON_Hooks* hooks) {
    if (!hooks) {
        cJSON_malloc = malloc;
        cJSON_free = free;
        return;
    }
    cJSON_malloc = (hooks->malloc_fn) ? hooks->malloc_fn : malloc;
    cJSON_free = (hooks->free_fn) ? hooks->free_fn : free;
}

static cJSON *cJSON_New_Item(void) {
    cJSON* node = (cJSON*)cJSON_malloc(sizeof(cJSON));
    if (node) memset(node, '\0', sizeof(cJSON));
    return node;
}

void cJSON_Delete(cJSON *c) {
    cJSON *next;
    while (c) {
        next = c->next;
        if (!(c->type & cJSON_IsReference) && c->child) cJSON_Delete(c->child);
        if (!(c->type & cJSON_IsReference) && c->valuestring) cJSON_free(c->valuestring);
        if (!(c->type & cJSON_StringIsConst) && c->string) cJSON_free(c->string);
        cJSON_free(c);
        c = next;
    }
}

static const char *skip(const char *in) {
    while (in && *in && ((unsigned char)*in <= 32)) in++;
    return in;
}

static const char *parse_value(cJSON *item, const char *value);
static char *print_value(const cJSON *item, int depth, int fmt);

static const char *parse_string(cJSON *item, const char *str) {
    const char *ptr = str + 1;
    char *ptr2;
    char *out;
    int len = 0;
    if (*str != '\"') return NULL;
    while (*ptr != '\"' && *ptr && ++len) {
        if (*ptr++ == '\\') ptr++;
    }
    out = (char*)cJSON_malloc(len + 1);
    if (!out) return NULL;
    ptr = str + 1;
    ptr2 = out;
    while (*ptr != '\"' && *ptr) {
        if (*ptr != '\\') *ptr2++ = *ptr++;
        else {
            ptr++;
            switch (*ptr) {
                case 'b': *ptr2++ = '\b'; break;
                case 'f': *ptr2++ = '\f'; break;
                case 'n': *ptr2++ = '\n'; break;
                case 'r': *ptr2++ = '\r'; break;
                case 't': *ptr2++ = '\t'; break;
                case '\"': *ptr2++ = '\"'; break;
                case '\\': *ptr2++ = '\\'; break;
                default: *ptr2++ = *ptr; break;
            }
            ptr++;
        }
    }
    *ptr2 = 0;
    if (*ptr == '\"') ptr++;
    item->valuestring = out;
    item->type = cJSON_String;
    return ptr;
}

static const char *parse_number(cJSON *item, const char *num) {
    double n = 0;
    char *endptr;
    n = strtod(num, &endptr);
    if (endptr == num) return NULL;
    item->valuedouble = n;
    item->valueint = (int)n;
    item->type = cJSON_Number;
    return endptr;
}

static const char *parse_array(cJSON *item, const char *value) {
    cJSON *child;
    if (*value != '[') return NULL;
    item->type = cJSON_Array;
    value = skip(value + 1);
    if (*value == ']') return value + 1;
    item->child = child = cJSON_New_Item();
    if (!item->child) return NULL;
    value = skip(parse_value(child, skip(value)));
    if (!value) return NULL;
    while (*value == ',') {
        cJSON *new_item = cJSON_New_Item();
        if (!new_item) return NULL;
        child->next = new_item;
        new_item->prev = child;
        child = new_item;
        value = skip(parse_value(child, skip(value + 1)));
        if (!value) return NULL;
    }
    if (*value == ']') return value + 1;
    return NULL;
}

static const char *parse_object(cJSON *item, const char *value) {
    cJSON *child;
    if (*value != '{') return NULL;
    item->type = cJSON_Object;
    value = skip(value + 1);
    if (*value == '}') return value + 1;
    item->child = child = cJSON_New_Item();
    if (!item->child) return NULL;
    value = skip(parse_string(child, skip(value)));
    if (!value) return NULL;
    child->string = child->valuestring;
    child->valuestring = NULL;
    value = skip(value);
    if (*value != ':') return NULL;
    value = skip(parse_value(child, skip(value + 1)));
    if (!value) return NULL;
    while (*value == ',') {
        cJSON *new_item = cJSON_New_Item();
        if (!new_item) return NULL;
        child->next = new_item;
        new_item->prev = child;
        child = new_item;
        value = skip(parse_string(child, skip(value + 1)));
        if (!value) return NULL;
        child->string = child->valuestring;
        child->valuestring = NULL;
        value = skip(value);
        if (*value != ':') return NULL;
        value = skip(parse_value(child, skip(value + 1)));
        if (!value) return NULL;
    }
    if (*value == '}') return value + 1;
    return NULL;
}

static const char *parse_value(cJSON *item, const char *value) {
    if (!value) return NULL;
    if (!strncmp(value, "null", 4)) { item->type = cJSON_NULL; return value + 4; }
    if (!strncmp(value, "false", 5)) { item->type = cJSON_False; return value + 5; }
    if (!strncmp(value, "true", 4)) { item->type = cJSON_True; item->valueint = 1; return value + 4; }
    if (*value == '\"') return parse_string(item, value);
    if (*value == '-' || (*value >= '0' && *value <= '9')) return parse_number(item, value);
    if (*value == '[') return parse_array(item, value);
    if (*value == '{') return parse_object(item, value);
    return NULL;
}

cJSON *cJSON_Parse(const char *value) {
    return cJSON_ParseWithLength(value, value ? strlen(value) : 0);
}

cJSON *cJSON_ParseWithLength(const char *value, size_t buffer_length) {
    (void)buffer_length;
    cJSON *c = cJSON_New_Item();
    if (!c) return NULL;
    const char *end = parse_value(c, skip(value));
    if (!end) { cJSON_Delete(c); return NULL; }
    return c;
}

static char *print_string_ptr(const char *str) {
    const char *ptr;
    char *ptr2, *out;
    int len = 0;
    if (!str) return strdup("\"\"");
    ptr = str;
    while (*ptr) {
        if ((unsigned char)*ptr < 32 || *ptr == '\"' || *ptr == '\\') len += 2;
        else len++;
        ptr++;
    }
    out = (char*)cJSON_malloc(len + 3);
    if (!out) return NULL;
    ptr2 = out;
    *ptr2++ = '\"';
    ptr = str;
    while (*ptr) {
        if ((unsigned char)*ptr > 31 && *ptr != '\"' && *ptr != '\\') *ptr2++ = *ptr++;
        else {
            *ptr2++ = '\\';
            switch (*ptr) {
                case '\\': *ptr2++ = '\\'; break;
                case '\"': *ptr2++ = '\"'; break;
                case '\b': *ptr2++ = 'b'; break;
                case '\f': *ptr2++ = 'f'; break;
                case '\n': *ptr2++ = 'n'; break;
                case '\r': *ptr2++ = 'r'; break;
                case '\t': *ptr2++ = 't'; break;
                default: sprintf(ptr2, "u%04x", (unsigned int)*ptr); ptr2 += 5; break;
            }
            ptr++;
        }
    }
    *ptr2++ = '\"';
    *ptr2 = 0;
    return out;
}

static char *print_number(const cJSON *item) {
    char *str = (char*)cJSON_malloc(64);
    if (!str) return NULL;
    double d = item->valuedouble;
    if (fabs(((double)item->valueint) - d) <= 1e-9 && d >= INT_MIN && d <= INT_MAX) {
        sprintf(str, "%d", item->valueint);
    } else {
        if (fabs(floor(d) - d) <= 1e-9 && fabs(d) < 1.0e60) sprintf(str, "%.0f", d);
        else sprintf(str, "%.8g", d);
    }
    return str;
}

static char *print_array(const cJSON *item, int depth, int fmt) {
    char **entries;
    char *out = NULL, *ptr, *ret;
    int len = 5;
    cJSON *child = item->child;
    int numentries = 0, i = 0, fail = 0;
    while (child) numentries++, child = child->next;
    if (!numentries) {
        out = (char*)cJSON_malloc(3);
        if (out) strcpy(out, "[]");
        return out;
    }
    entries = (char**)cJSON_malloc(numentries * sizeof(char*));
    if (!entries) return NULL;
    child = item->child;
    while (child && !fail) {
        ret = print_value(child, depth + 1, fmt);
        entries[i++] = ret;
        if (ret) len += strlen(ret) + 2 + (fmt ? 1 : 0);
        else fail = 1;
        child = child->next;
    }
    if (!fail) out = (char*)cJSON_malloc(len);
    if (!out) fail = 1;
    if (fail) {
        for (i = 0; i < numentries; i++) if (entries[i]) cJSON_free(entries[i]);
        cJSON_free(entries);
        return NULL;
    }
    *out = '[';
    ptr = out + 1;
    *ptr = 0;
    for (i = 0; i < numentries; i++) {
        strcpy(ptr, entries[i]);
        ptr += strlen(entries[i]);
        if (i != numentries - 1) { *ptr++ = ','; if (fmt) *ptr++ = ' '; *ptr = 0; }
        cJSON_free(entries[i]);
    }
    cJSON_free(entries);
    *ptr++ = ']';
    *ptr = 0;
    return out;
}

static char *print_object(const cJSON *item, int depth, int fmt) {
    char **entries = NULL, **names = NULL;
    char *out = NULL, *ptr, *ret, *str;
    int len = 7, i = 0, numentries = 0, fail = 0;
    cJSON *child = item->child;
    while (child) numentries++, child = child->next;
    if (!numentries) {
        out = (char*)cJSON_malloc(3);
        if (out) strcpy(out, "{}");
        return out;
    }
    entries = (char**)cJSON_malloc(numentries * sizeof(char*));
    names = (char**)cJSON_malloc(numentries * sizeof(char*));
    if (!entries || !names) { if (entries) cJSON_free(entries); if (names) cJSON_free(names); return NULL; }
    child = item->child;
    while (child && !fail) {
        names[i] = str = print_string_ptr(child->string);
        entries[i] = ret = print_value(child, depth + 1, fmt);
        if (str && ret) len += strlen(ret) + strlen(str) + 2 + (fmt ? 2 : 0);
        else fail = 1;
        i++;
        child = child->next;
    }
    if (!fail) out = (char*)cJSON_malloc(len);
    if (!out) fail = 1;
    if (fail) {
        for (i = 0; i < numentries; i++) {
            if (names[i]) cJSON_free(names[i]);
            if (entries[i]) cJSON_free(entries[i]);
        }
        cJSON_free(names); cJSON_free(entries);
        return NULL;
    }
    *out = '{'; ptr = out + 1; *ptr = 0;
    for (i = 0; i < numentries; i++) {
        strcpy(ptr, names[i]); ptr += strlen(names[i]);
        *ptr++ = ':'; if (fmt) *ptr++ = ' ';
        strcpy(ptr, entries[i]); ptr += strlen(entries[i]);
        if (i != numentries - 1) { *ptr++ = ','; if (fmt) *ptr++ = ' '; }
        *ptr = 0;
        cJSON_free(names[i]); cJSON_free(entries[i]);
    }
    cJSON_free(names); cJSON_free(entries);
    *ptr++ = '}'; *ptr = 0;
    return out;
}

static char *print_value(const cJSON *item, int depth, int fmt) {
    char *out = NULL;
    if (!item) return NULL;
    switch ((item->type) & 255) {
        case cJSON_NULL: out = strdup("null"); break;
        case cJSON_False: out = strdup("false"); break;
        case cJSON_True: out = strdup("true"); break;
        case cJSON_Number: out = print_number(item); break;
        case cJSON_String: out = print_string_ptr(item->valuestring); break;
        case cJSON_Array: out = print_array(item, depth, fmt); break;
        case cJSON_Object: out = print_object(item, depth, fmt); break;
    }
    return out;
}

char *cJSON_Print(const cJSON *item) { return print_value(item, 0, 1); }
char *cJSON_PrintUnformatted(const cJSON *item) { return print_value(item, 0, 0); }

int cJSON_GetArraySize(const cJSON *array) {
    cJSON *c = array ? array->child : NULL;
    int i = 0;
    while (c) i++, c = c->next;
    return i;
}

cJSON *cJSON_GetArrayItem(const cJSON *array, int index) {
    cJSON *c = array ? array->child : NULL;
    while (c && index > 0) index--, c = c->next;
    return c;
}

cJSON *cJSON_GetObjectItem(const cJSON * const object, const char * const string) {
    cJSON *c = object ? object->child : NULL;
    while (c && strcasecmp(c->string, string)) c = c->next;
    return c;
}

cJSON *cJSON_GetObjectItemCaseSensitive(const cJSON * const object, const char * const string) {
    cJSON *c = object ? object->child : NULL;
    while (c && strcmp(c->string, string)) c = c->next;
    return c;
}

cJSON_bool cJSON_HasObjectItem(const cJSON *object, const char *string) {
    return cJSON_GetObjectItem(object, string) ? 1 : 0;
}

cJSON *cJSON_CreateNull(void) { cJSON *item = cJSON_New_Item(); if (item) item->type = cJSON_NULL; return item; }
cJSON *cJSON_CreateTrue(void) { cJSON *item = cJSON_New_Item(); if (item) item->type = cJSON_True; return item; }
cJSON *cJSON_CreateFalse(void) { cJSON *item = cJSON_New_Item(); if (item) item->type = cJSON_False; return item; }
cJSON *cJSON_CreateBool(cJSON_bool boolean) { cJSON *item = cJSON_New_Item(); if (item) item->type = boolean ? cJSON_True : cJSON_False; return item; }
cJSON *cJSON_CreateNumber(double num) { cJSON *item = cJSON_New_Item(); if (item) { item->type = cJSON_Number; item->valuedouble = num; item->valueint = (int)num; } return item; }
cJSON *cJSON_CreateString(const char *string) { cJSON *item = cJSON_New_Item(); if (item) { item->type = cJSON_String; item->valuestring = strdup(string ? string : ""); } return item; }
cJSON *cJSON_CreateArray(void) { cJSON *item = cJSON_New_Item(); if (item) item->type = cJSON_Array; return item; }
cJSON *cJSON_CreateObject(void) { cJSON *item = cJSON_New_Item(); if (item) item->type = cJSON_Object; return item; }

cJSON_bool cJSON_AddItemToArray(cJSON *array, cJSON *item) {
    cJSON *c = array ? array->child : NULL;
    if (!item) return 0;
    if (!c) { array->child = item; }
    else { while (c && c->next) c = c->next; c->next = item; item->prev = c; }
    return 1;
}

cJSON_bool cJSON_AddItemToObject(cJSON *object, const char *string, cJSON *item) {
    if (!item || !object || !string) return 0;
    if (item->string) cJSON_free(item->string);
    item->string = strdup(string);
    return cJSON_AddItemToArray(object, item);
}

cJSON_bool cJSON_AddNullToObject(cJSON * const object, const char * const name) { return cJSON_AddItemToObject(object, name, cJSON_CreateNull()); }
cJSON_bool cJSON_AddTrueToObject(cJSON * const object, const char * const name) { return cJSON_AddItemToObject(object, name, cJSON_CreateTrue()); }
cJSON_bool cJSON_AddFalseToObject(cJSON * const object, const char * const name) { return cJSON_AddItemToObject(object, name, cJSON_CreateFalse()); }
cJSON_bool cJSON_AddBoolToObject(cJSON * const object, const char * const name, const cJSON_bool boolean) { return cJSON_AddItemToObject(object, name, cJSON_CreateBool(boolean)); }
cJSON_bool cJSON_AddNumberToObject(cJSON * const object, const char * const name, const double number) { return cJSON_AddItemToObject(object, name, cJSON_CreateNumber(number)); }
cJSON_bool cJSON_AddStringToObject(cJSON * const object, const char * const name, const char * const string) { return cJSON_AddItemToObject(object, name, cJSON_CreateString(string)); }

cJSON_bool cJSON_IsInvalid(const cJSON * const item) { return (item == NULL) || (item->type == cJSON_Invalid); }
cJSON_bool cJSON_IsFalse(const cJSON * const item) { return (item != NULL) && ((item->type & 255) == cJSON_False); }
cJSON_bool cJSON_IsTrue(const cJSON * const item) { return (item != NULL) && ((item->type & 255) == cJSON_True); }
cJSON_bool cJSON_IsBool(const cJSON * const item) { return (item != NULL) && (((item->type & 255) == cJSON_True) || ((item->type & 255) == cJSON_False)); }
cJSON_bool cJSON_IsNull(const cJSON * const item) { return (item != NULL) && ((item->type & 255) == cJSON_NULL); }
cJSON_bool cJSON_IsNumber(const cJSON * const item) { return (item != NULL) && ((item->type & 255) == cJSON_Number); }
cJSON_bool cJSON_IsString(const cJSON * const item) { return (item != NULL) && ((item->type & 255) == cJSON_String); }
cJSON_bool cJSON_IsArray(const cJSON * const item) { return (item != NULL) && ((item->type & 255) == cJSON_Array); }
cJSON_bool cJSON_IsObject(const cJSON * const item) { return (item != NULL) && ((item->type & 255) == cJSON_Object); }
cJSON_bool cJSON_IsRaw(const cJSON * const item) { return (item != NULL) && ((item->type & 255) == cJSON_Raw); }

