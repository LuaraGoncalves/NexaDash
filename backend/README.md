NexaDash — Backend (API)

Este repositório contém o backend (API) do projeto NexaDash, desenvolvido com Laravel.
O backend é responsável por fornecer dados para o frontend através de uma API REST.

No momento, o projeto encontra-se em desenvolvimento.

📦 Tecnologias

Laravel

PHP 8.2+

PostgreSQL ou MySQL

🚀 Como executar o projeto
1. Acesse a pasta do backend:

cd backend

2. Instale as dependências:

composer install

3. Configure o ambiente:

Copie o arquivo .env.example para .env

Ajuste as variáveis do banco de dados conforme sua máquina

4. Gere a chave da aplicação:

php artisan key:generate

5. Crie as tabelas:

php artisan migrate

6. Inicie o servidor:

php artisan serve

A API ficará disponível em:

http://localhost:8000


📁 Estrutura

routes/api.php → rotas da API

app/Models → modelos

app/Http/Controllers → regras de negócio

 Status do projeto

 Em desenvolvimento