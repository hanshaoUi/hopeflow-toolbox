cmake_minimum_required(VERSION 3.16)
project(graphic_relief_native LANGUAGES CXX)

enable_testing()

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(graphic_relief_bench
  graphic_relief_bench.cpp
)

add_executable(graphic_relief_native
  graphic_relief_native.cpp
)

add_test(NAME graphic_relief_native_self_test
  COMMAND graphic_relief_native --self-test
)

if (MSVC)
  target_compile_options(graphic_relief_bench PRIVATE /O2 /EHsc)
  target_compile_options(graphic_relief_native PRIVATE /O2 /EHsc)
else()
  target_compile_options(graphic_relief_bench PRIVATE -O3)
  target_compile_options(graphic_relief_native PRIVATE -O3)
endif()
