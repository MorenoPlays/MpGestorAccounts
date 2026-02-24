export interface Movimentacao {
  id: string;
  motivo: string;
  valor: number;
  tipo: 'adicionar' | 'descontar';
  data: string;
}

export interface Conta {
  id: string;
  pessoa: string;
  saldoInicial: number;
  movimentacoes: Movimentacao[];
  data: string;
}
