import { Platform } from 'react-native';

import { getDatabase } from '@/data/sqlite/db';

let initialized = false;

const CREATE_COMPRAS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS compras (
  id TEXT PRIMARY KEY NOT NULL,
  cartao_id TEXT NOT NULL,
  ciclo_id TEXT NOT NULL,
  valor REAL NOT NULL CHECK (valor >= 0),
  data_compra TEXT NOT NULL,
  parcela_atual INTEGER,
  parcela_total INTEGER,
  titulo TEXT NOT NULL,
  descricao TEXT,
  local TEXT NOT NULL,
  categoria TEXT NOT NULL,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);
`;

const CREATE_INDEXES_SQL = `
CREATE INDEX IF NOT EXISTS idx_compras_ciclo_id ON compras (ciclo_id);
CREATE INDEX IF NOT EXISTS idx_compras_data_compra ON compras (data_compra);
`;

export async function initDatabase(): Promise<void> {
  if (Platform.OS === 'web') {
    initialized = true;
    return;
  }

  if (initialized) {
    return;
  }

  const db = await getDatabase();
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync(CREATE_COMPRAS_TABLE_SQL);
  await db.execAsync(CREATE_INDEXES_SQL);

  initialized = true;
}
