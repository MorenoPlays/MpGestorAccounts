# Gestão de Contas

Uma aplicação web simples e intuitiva para gerenciar contas financeiras pessoais de múltiplas pessoas.

## Descrição

Este projeto permite que você:

- **Criar contas** para diferentes pessoas com saldo inicial
- **Registrar movimentações** (adições e descontos) em cada conta
- **Acompanhar o histórico** de todas as transações realizadas
- **Calcular saldo** automaticamente baseado nas movimentações
- **Excluir contas e movimentações** conforme necessário
- **Visualizar todas as contas** em uma interface limpa e organizada

## Tecnologias Utilizadas

- **React 18** - Framework UI
- **TypeScript** - Linguagem de programação tipada
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utilitário
- **Radix UI** - Componentes acessíveis e reutilizáveis
- **Lucide React** - Ícones de interface
- **Sonner** - Notificações elegantes

## Como Usar

1. **Adicionar uma Conta**: Clique no botão "Nova Conta" e preencha o nome da pessoa e saldo inicial (opcional)
2. **Registrar Movimentação**: Para cada conta, clique em "Adicionar Movimentação", insira o motivo, valor e escolha se é adição ou desconto
3. **Ver Histórico**: Cada conta exibe o histórico completo de todas as movimentações
4. **Remover Dados**: Use o ícone de lixeira para deletar contas ou movimentações individuais

## Instalação e Execução

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

A aplicação abrirá em `http://localhost:5174`
