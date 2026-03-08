import { calcularCicloAtual } from '@/domain/invoice-cycle';
import { criarCompra, editarCompra as editarCompraDominio } from '@/domain/purchase-ops';
import {
  CARTAO_PADRAO,
  type Compra,
  type ConfiguracaoCartao,
  type EdicaoCompraInput,
  type NovaCompraInput,
} from '@/domain/types';
import { getDatabase } from '@/data/sqlite/db';
import { initDatabase } from '@/data/sqlite/schema';

type CompraRow = {
  id: string;
  cartao_id: string;
  ciclo_id: string;
  valor: number;
  data_compra: string;
  parcela_atual: number | null;
  parcela_total: number | null;
  titulo: string;
  descricao: string | null;
  local: string;
  categoria: Compra['categoria'];
  criado_em: string;
  atualizado_em: string;
};

async function databaseReady() {
  await initDatabase();
  return getDatabase();
}

function mapRowToCompra(row: CompraRow): Compra {
  return {
    id: row.id,
    cartaoId: row.cartao_id as Compra['cartaoId'],
    cicloId: row.ciclo_id as Compra['cicloId'],
    valor: row.valor,
    dataCompra: row.data_compra as Compra['dataCompra'],
    parcela:
      row.parcela_atual !== null && row.parcela_total !== null
        ? { atual: row.parcela_atual, total: row.parcela_total }
        : undefined,
    titulo: row.titulo,
    descricao: row.descricao ?? undefined,
    local: row.local,
    categoria: row.categoria,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

function toInsertParams(compra: Compra) {
  return [
    compra.id,
    compra.cartaoId,
    compra.cicloId,
    compra.valor,
    compra.dataCompra,
    compra.parcela?.atual ?? null,
    compra.parcela?.total ?? null,
    compra.titulo,
    compra.descricao ?? null,
    compra.local,
    compra.categoria,
    compra.criadoEm,
    compra.atualizadoEm,
  ];
}

function toUpdateParams(compra: Compra) {
  return [
    compra.cartaoId,
    compra.cicloId,
    compra.valor,
    compra.dataCompra,
    compra.parcela?.atual ?? null,
    compra.parcela?.total ?? null,
    compra.titulo,
    compra.descricao ?? null,
    compra.local,
    compra.categoria,
    compra.atualizadoEm,
    compra.id,
  ];
}

export async function obterCompraPorId(compraId: string): Promise<Compra | null> {
  const db = await databaseReady();
  const row = await db.getFirstAsync<CompraRow>('SELECT * FROM compras WHERE id = ?;', [compraId]);
  return row ? mapRowToCompra(row) : null;
}

export async function inserirCompra(compra: Compra): Promise<void> {
  const db = await databaseReady();
  await db.runAsync(
    `INSERT INTO compras (
      id,
      cartao_id,
      ciclo_id,
      valor,
      data_compra,
      parcela_atual,
      parcela_total,
      titulo,
      descricao,
      local,
      categoria,
      criado_em,
      atualizado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    toInsertParams(compra)
  );
}

export async function criarEInserirCompra(input: NovaCompraInput, id: string): Promise<Compra> {
  const compra = criarCompra(input, CARTAO_PADRAO, { id });
  await inserirCompra(compra);
  return compra;
}

export async function editarCompra(
  compraId: string,
  edicao: EdicaoCompraInput,
  cartao: ConfiguracaoCartao = CARTAO_PADRAO
): Promise<Compra | null> {
  const atual = await obterCompraPorId(compraId);
  if (!atual) {
    return null;
  }

  const atualizada = editarCompraDominio(atual, edicao, cartao);
  const db = await databaseReady();

  await db.runAsync(
    `UPDATE compras
     SET
      cartao_id = ?,
      ciclo_id = ?,
      valor = ?,
      data_compra = ?,
      parcela_atual = ?,
      parcela_total = ?,
      titulo = ?,
      descricao = ?,
      local = ?,
      categoria = ?,
      atualizado_em = ?
     WHERE id = ?;`,
    toUpdateParams(atualizada)
  );

  return atualizada;
}

export async function excluirCompra(compraId: string): Promise<void> {
  const db = await databaseReady();
  await db.runAsync('DELETE FROM compras WHERE id = ?;', [compraId]);
}

export async function listarCompras(): Promise<Compra[]> {
  const db = await databaseReady();
  const rows = await db.getAllAsync<CompraRow>(
    'SELECT * FROM compras ORDER BY data_compra DESC, criado_em DESC;'
  );

  return rows.map(mapRowToCompra);
}

export async function listarComprasPorCiclo(cicloId: Compra['cicloId']): Promise<Compra[]> {
  const db = await databaseReady();
  const rows = await db.getAllAsync<CompraRow>(
    'SELECT * FROM compras WHERE ciclo_id = ? ORDER BY data_compra DESC, criado_em DESC;',
    [cicloId]
  );

  return rows.map(mapRowToCompra);
}

export async function listarComprasDoCicloAtual(
  dataReferencia: Date = new Date(),
  cartao: ConfiguracaoCartao = CARTAO_PADRAO
): Promise<Compra[]> {
  const cicloAtual = calcularCicloAtual(dataReferencia, cartao);
  return listarComprasPorCiclo(cicloAtual.id);
}
