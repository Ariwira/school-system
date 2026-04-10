/**
 * Helper untuk membangun mock rantai query Drizzle ORM.
 *
 * Drizzle ORM menggunakan builder pattern dengan PromiseLike interface.
 * Setiap method chain mengembalikan object yang sama (chainable),
 * dan ketika di-await melalui .then(), mengembalikan rows.
 *
 * Pola penggunaan:
 *   mockDb.select.mockReturnValueOnce(mockSelectChain([row1, row2]))
 *   // Selanjutnya: db.select().from(...).where(...).limit(...) -> [row1, row2]
 */
import { vi } from 'vitest'

type ChainFn = () => ChainObject
type ChainObject = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
  then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => Promise<unknown>
}

/**
 * Buat object yang bisa di-chain dan di-await sekaligus.
 * Semua method selain `then`/`catch` mengembalikan object yang sama.
 */
function makeChainable(resolveValue: unknown): ChainObject {
  const obj: ChainObject = {
    then: (resolve, reject) => Promise.resolve(resolveValue).then(resolve, reject),
  }

  const chainMethods = [
    'from', 'where', 'limit', 'offset', 'orderBy',
    'leftJoin', 'innerJoin', 'groupBy', 'having',
    'returning', 'select', 'set', 'into', 'values',
    'onConflictDoUpdate', 'onConflictDoNothing',
  ] as const

  for (const method of chainMethods) {
    obj[method] = () => obj
  }

  return obj
}

/**
 * Buat mock chain untuk db.select() yang menghasilkan rows ketika di-await.
 *
 * Contoh:
 *   mockDb.select.mockReturnValueOnce(mockSelectChain([{ id: '1', name: 'Test' }]))
 */
export function mockSelectChain(rows: unknown[] = []): ChainObject {
  return makeChainable(rows)
}

/**
 * Buat mock chain untuk db.insert().values().returning().
 * .returning() harus bisa di-await dan mengembalikan rows.
 *
 * Contoh:
 *   mockDb.insert.mockReturnValueOnce(mockInsertChain([{ id: 'new-id' }]))
 */
export function mockInsertChain(returnedRows: unknown[] = []): ChainObject {
  return makeChainable(returnedRows)
}

/**
 * Buat mock chain untuk db.update().set().where().
 *
 * Contoh:
 *   mockDb.update.mockReturnValueOnce(mockUpdateChain())
 */
export function mockUpdateChain(returnedRows: unknown[] = []): ChainObject {
  return makeChainable(returnedRows)
}

/**
 * Setup urutan mock db.select() calls.
 * Setiap element array adalah rows yang dikembalikan untuk panggilan select ke-N.
 *
 * Contoh:
 *   setupSelectSequence(mockDb, [
 *     [{ id: 'student-1', status: 'active' }],  // panggilan select ke-1
 *     [{ id: 'fee-1', amount: '500000' }],       // panggilan select ke-2
 *   ])
 */
export function setupSelectSequence(
  mockDb: { select: ReturnType<typeof vi.fn> },
  sequence: unknown[][],
) {
  for (const rows of sequence) {
    mockDb.select.mockReturnValueOnce(mockSelectChain(rows))
  }
}
