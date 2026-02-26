type UpdateResult = { error: unknown };

function throwOnMutationErrors(results: UpdateResult[]) {
  for (const result of results) {
    if (result.error) {
      throw result.error;
    }
  }
}

export function withReorderedIndexes<T extends { id: string; order_index: number }>(items: T[], orderedIds: string[]): T[] {
  const indexById = new Map(orderedIds.map((id, index) => [id, index]));

  return items.map((item) => {
    const nextIndex = indexById.get(item.id);
    if (nextIndex === undefined) return item;
    return { ...item, order_index: nextIndex };
  });
}

export async function runTwoPhaseOrderUpdate(
  ids: string[],
  updateAtIndex: (id: string, index: number) => PromiseLike<UpdateResult> | UpdateResult
) {
  const temporaryResults = await Promise.all(
    ids.map((id, index) => Promise.resolve(updateAtIndex(id, -(index + 1))))
  );
  throwOnMutationErrors(temporaryResults);

  const finalResults = await Promise.all(ids.map((id, index) => Promise.resolve(updateAtIndex(id, index))));
  throwOnMutationErrors(finalResults);
}
