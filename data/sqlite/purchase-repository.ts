import { Platform } from 'react-native';

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

const WEB_COMPRAS_KEY = 'sqlite.web.compras.v1';

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

let webMemoryCompras: Compra[] = [];

async function readWebCompras(): Promise<Compra[]> {
  if (Platform.OS !== 'web') return [];

  const storage = globalThis.localStorage;
  if (!storage) return webMemoryCompras;

  const raw = storage.getItem(WEB_COMPRAS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Compra[]) : [];
  } catch {
    return [];
  }
}

async function writeWebCompras(compras: Compra[]): Promise<void> {
  if (Platform.OS !== 'web') return;

  webMemoryCompras = compras;
  const storage = globalThis.localStorage;
  if (storage) {
    storage.setItem(WEB_COMPRAS_KEY, JSON.stringify(compras));
  }
}

function sortCompras(compras: Compra[]): Compra[] {
  return [...compras].sort((a, b) => {
    const dateCompare = b.dataCompra.localeCompare(a.dataCompra);
    if (dateCompare !== 0) return dateCompare;

    return b.criadoEm.localeCompare(a.criadoEm);
  });
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
  if (Platform.OS === 'web') {
    const compras = await readWebCompras();
    return compras.find((compra) => compra.id === compraId) ?? null;
  }

  const db = await databaseReady();
  const row = await db.getFirstAsync<CompraRow>('SELECT * FROM compras WHERE id = ?;', [compraId]);
  return row ? mapRowToCompra(row) : null;
}

export async function inserirCompra(compra: Compra): Promise<void> {
  if (Platform.OS === 'web') {
    const compras = await readWebCompras();
    if (compras.some((entry) => entry.id === compra.id)) {
      throw new Error('Compra já existe.');
    }
    await writeWebCompras([...compras, compra]);
    return;
  }

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

  if (Platform.OS === 'web') {
    const compras = await readWebCompras();
    await writeWebCompras(compras.map((compra) => (compra.id === compraId ? atualizada : compra)));
    return atualizada;
  }

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
  if (Platform.OS === 'web') {
    const compras = await readWebCompras();
    await writeWebCompras(compras.filter((compra) => compra.id !== compraId));
    return;
  }

  const db = await databaseReady();
  await db.runAsync('DELETE FROM compras WHERE id = ?;', [compraId]);
}

export async function listarCompras(): Promise<Compra[]> {
  if (Platform.OS === 'web') {
    return sortCompras(await readWebCompras());
  }

  const db = await databaseReady();
  const rows = await db.getAllAsync<CompraRow>(
    'SELECT * FROM compras ORDER BY data_compra DESC, criado_em DESC;'
  );

  return rows.map(mapRowToCompra);
}

export async function listarComprasPorCiclo(cicloId: Compra['cicloId']): Promise<Compra[]> {
  if (Platform.OS === 'web') {
    const compras = await readWebCompras();
    return sortCompras(compras.filter((compra) => compra.cicloId === cicloId));
  }

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
