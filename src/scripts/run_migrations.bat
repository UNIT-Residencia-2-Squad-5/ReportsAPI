@echo off
set CONTAINER=reports-postgres
set DB=reports-db
set USER=user

REM Caminho relativo para migrations
set MIGRATIONS_DIR=..\infrastructure\db\migrations

echo =====================================
echo Rodando migrations do diretorio:
echo %MIGRATIONS_DIR%
echo =====================================

if not exist "%MIGRATIONS_DIR%" (
    echo ERRO: Pasta migrations nao encontrada.
    pause
    exit /b 1
)

for /f "delims=" %%f in ('dir "%MIGRATIONS_DIR%\*.sql" /b /on') do (
    echo Executando: %%f

    docker exec -i %CONTAINER% psql ^
        -U %USER% ^
        -d %DB% ^
        -v ON_ERROR_STOP=1 ^
        -f /migrations/%%f

    if errorlevel 1 (
        echo ERRO na migration %%f
        pause
        exit /b 1
    )
)

echo =====================================
echo Todas migrations executadas com sucesso
echo =====================================
pause
