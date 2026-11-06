cmake_minimum_required(VERSION 3.16)
project(CSA0201_B_CAPSTONE_IMBS C)

set(CMAKE_C_STANDARD 17)
set(CMAKE_C_STANDARD_REQUIRED ON)

include_directories(include)

set(DOMAIN_SOURCES
    src/domain/uom.c
    src/domain/tax.c
    src/domain/inventory.c
    src/domain/billing.c
    src/domain/payments.c
    src/domain/accounting.c
    src/domain/returns.c
    src/domain/procurement.c
    src/domain/product.c
    src/domain/reporting.c
)

set(SERVER_SOURCES
    src/main.c
    src/config.c
    src/cJSON.c
    src/http_server.c
    src/db/db_adapter.c
    ${DOMAIN_SOURCES}
)

add_executable(imbs_server ${SERVER_SOURCES})

if(WIN32)
    target_link_libraries(imbs_server ws2_32)
else()
    find_package(Threads REQUIRED)
    target_link_libraries(imbs_server Threads::Threads)
endif()

# Unit test binary
add_executable(test_domain_engine tests/unit/test_domain_engine.c ${DOMAIN_SOURCES})
enable_testing()
add_test(NAME DomainEngineTest COMMAND test_domain_engine)

