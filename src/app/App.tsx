import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../app/components/ui/card';
import { Button } from '../app/components/ui/button';
import { Input } from '../app/components/ui/input';
import { Label } from '../app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../app/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../app/components/ui/dialog';
import { Trash2, Plus, User, ArrowUpCircle, ArrowDownCircle, History } from 'lucide-react';
import { Toaster } from '../app/components/ui/sonner';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../app/components/ui/collapsible';

interface Movimentacao {
  id: string;
  motivo: string;
  valor: number;
  tipo: 'adicionar' | 'descontar';
  data: string;
}

interface Conta {
  id: string;
  pessoa: string;
  saldoInicial: number;
  movimentacoes: Movimentacao[];
  data: string;
}

export default function App() {
  const [contas, setContas] = useState<Conta[]>([
    {
      id: '1',
      pessoa: 'João Silva',
      saldoInicial: 0,
      movimentacoes: [
        {
          id: '1',
          motivo: 'Almoço dividido',
          valor: 50,
          tipo: 'adicionar',
          data: new Date('2026-02-01').toISOString()
        }
      ],
      data: new Date('2026-02-01').toISOString()
    },
    {
      id: '2',
      pessoa: 'Maria Santos',
      saldoInicial: 0,
      movimentacoes: [
        {
          id: '2',
          motivo: 'Empréstimo',
          valor: 200,
          tipo: 'descontar',
          data: new Date('2026-01-28').toISOString()
        }
      ],
      data: new Date('2026-01-28').toISOString()
    }
  ]);

  const [open, setOpen] = useState(false);
  const [openMovimentacao, setOpenMovimentacao] = useState<string | null>(null);
  const [pessoa, setPessoa] = useState('');
  const [saldoInicial, setSaldoInicial] = useState('');
  
  const [motivo, setMotivo] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<'adicionar' | 'descontar'>('adicionar');

  const handleAddConta = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pessoa) return;

    const novaConta: Conta = {
      id: Date.now().toString(),
      pessoa,
      saldoInicial: saldoInicial ? parseFloat(saldoInicial) : 0,
      movimentacoes: [],
      data: new Date().toISOString()
    };

    setContas([novaConta, ...contas]);
    toast.success('Conta adicionada!');
    
    setPessoa('');
    setSaldoInicial('');
    setOpen(false);
  };

  const handleAddMovimentacao = (e: React.FormEvent, contaId: string) => {
    e.preventDefault();
    
    if (!motivo || !valor) return;

    const novaMovimentacao: Movimentacao = {
      id: Date.now().toString(),
      motivo,
      valor: parseFloat(valor),
      tipo,
      data: new Date().toISOString()
    };

    setContas(contas.map(c => {
      if (c.id === contaId) {
        return {
          ...c,
          movimentacoes: [novaMovimentacao, ...c.movimentacoes]
        };
      }
      return c;
    }));

    toast.success(tipo === 'adicionar' ? 'Valor adicionado!' : 'Valor descontado!');
    
    setMotivo('');
    setValor('');
    setOpenMovimentacao(null);
  };

  const handleDeleteMovimentacao = (contaId: string, movId: string) => {
    setContas(contas.map(c => {
      if (c.id === contaId) {
        return {
          ...c,
          movimentacoes: c.movimentacoes.filter(m => m.id !== movId)
        };
      }
      return c;
    }));
    toast.success('Movimentação removida!');
  };

  const handleDeleteConta = (id: string) => {
    setContas(contas.filter(c => c.id !== id));
    toast.success('Conta removida!');
  };

  const calcularSaldo = (conta: Conta) => {
    return conta.movimentacoes.reduce((acc, m) => {
      return m.tipo === 'adicionar' ? acc + m.valor : acc - m.valor;
    }, conta.saldoInicial);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Calcular totais gerais
  const totalPositivo = contas.reduce((acc, c) => {
    const saldo = calcularSaldo(c);
    return saldo > 0 ? acc + saldo : acc;
  }, 0);

  const totalNegativo = contas.reduce((acc, c) => {
    const saldo = calcularSaldo(c);
    return saldo < 0 ? acc + Math.abs(saldo) : acc;
  }, 0);

  const saldoGeral = totalPositivo - totalNegativo;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6 max-w-5xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl">Controle de Contas</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie contas individuais de cada pessoa
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Nova Conta</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddConta} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pessoa">Nome da Pessoa</Label>
                  <Input
                    id="pessoa"
                    value={pessoa}
                    onChange={(e) => setPessoa(e.target.value)}
                    placeholder="Ex: João Silva"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="saldoInicial">Saldo Inicial (Opcional)</Label>
                  <Input
                    id="saldoInicial"
                    type="number"
                    step="0.01"
                    value={saldoInicial}
                    onChange={(e) => setSaldoInicial(e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco se começar do zero
                  </p>
                </div>

                <Button type="submit" className="w-full">
                  Criar Conta
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Contas */}
        <div className="space-y-4">
          {contas.map((conta) => {
            const saldo = calcularSaldo(conta);
            
            return (
              <Card key={conta.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg sm:text-xl">{conta.pessoa}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`text-lg sm:text-xl font-semibold ${saldo > 0 ? 'text-green-600' : saldo < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {formatCurrency(saldo)}
                      </div>
                      <Dialog open={openMovimentacao === conta.id} onOpenChange={(isOpen) => setOpenMovimentacao(isOpen ? conta.id : null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-1 sm:gap-2">
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Movimentar</span>
                            <span className="sm:hidden">Mov</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Movimentar Conta - {conta.pessoa}</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={(e) => handleAddMovimentacao(e, conta.id)} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="motivo">Motivo</Label>
                              <Input
                                id="motivo"
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                placeholder="Ex: Pagamento, Empréstimo, Compra..."
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="valor">Valor (R$)</Label>
                              <Input
                                id="valor"
                                type="number"
                                step="0.01"
                                value={valor}
                                onChange={(e) => setValor(e.target.value)}
                                placeholder="0.00"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="tipo">Tipo</Label>
                              <Select value={tipo} onValueChange={(value) => setTipo(value as 'adicionar' | 'descontar')}>
                                <SelectTrigger id="tipo">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="adicionar">Adicionar ao Saldo</SelectItem>
                                  <SelectItem value="descontar">Descontar do Saldo</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <Button type="submit" className="w-full">
                              Confirmar
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteConta(conta.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {conta.saldoInicial !== 0 && (
                    <p className="text-sm text-muted-foreground">
                      Saldo inicial: {formatCurrency(conta.saldoInicial)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Conta criada em: {formatDate(conta.data)}
                  </p>
                </CardHeader>
                <CardContent>
                  {conta.movimentacoes.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground text-sm">
                      Nenhuma movimentação ainda
                    </p>
                  ) : (
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full gap-2 text-sm">
                          <History className="h-4 w-4" />
                          Ver Histórico ({conta.movimentacoes.length} movimentações)
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-2 mt-4">
                        {conta.movimentacoes.map((mov) => (
                          <div
                            key={mov.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {mov.tipo === 'adicionar' ? (
                                <ArrowUpCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                              ) : (
                                <ArrowDownCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{mov.motivo}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">{formatDate(mov.data)}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-3 ml-8 sm:ml-0">
                              <span
                                className={`font-semibold text-sm sm:text-base ${
                                  mov.tipo === 'adicionar' ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {mov.tipo === 'adicionar' ? '+' : '-'} {formatCurrency(mov.valor)}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteMovimentacao(conta.id, mov.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {contas.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  Nenhuma conta cadastrada. Clique em "Nova Conta" para começar.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Toaster />
    </div>
  );
}