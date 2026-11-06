# Makefile for CSA0201-B-CAPSTONE-IMBS
CC = gcc
CFLAGS = -Wall -Wextra -std=c17 -O2 -Iinclude
LDFLAGS = 

ifeq ($(OS),Windows_NT)
    LDFLAGS += -lws2_32
    BIN_EXT = .exe
else
    LDFLAGS += -pthread
    BIN_EXT = 
endif

SRCS = src/main.c \
       src/config.c \
       src/cJSON.c \
       src/http_server.c \
       src/db/db_adapter.c \
       src/domain/uom.c \
       src/domain/tax.c \
       src/domain/inventory.c \
       src/domain/billing.c \
       src/domain/payments.c \
       src/domain/accounting.c \
       src/domain/returns.c \
       src/domain/procurement.c \
       src/domain/product.c \
       src/domain/reporting.c

TEST_SRCS = tests/unit/test_domain_engine.c \
            src/domain/uom.c \
            src/domain/tax.c \
            src/domain/inventory.c \
            src/domain/billing.c \
            src/domain/payments.c \
            src/domain/accounting.c \
            src/domain/returns.c \
            src/domain/procurement.c \
            src/domain/product.c \
            src/domain/reporting.c

TARGET = bin/imbs_server$(BIN_EXT)
TEST_TARGET = bin/test_domain_engine$(BIN_EXT)

.PHONY: all clean test dirs run

all: dirs $(TARGET) $(TEST_TARGET)

dirs:
	mkdir -p bin

$(TARGET): $(SRCS)
	$(CC) $(CFLAGS) $(SRCS) -o $(TARGET) $(LDFLAGS)

$(TEST_TARGET): $(TEST_SRCS)
	$(CC) $(CFLAGS) $(TEST_SRCS) -o $(TEST_TARGET)

test: $(TEST_TARGET)
	./$(TEST_TARGET)

clean:
	rm -rf bin *.o *.exe

