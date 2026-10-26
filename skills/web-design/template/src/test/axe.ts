import axe from 'axe-core'

// Run axe on a subtree and return readable violations (rule id + first target).
// Waits for running animations first: mid-fade colors are not what the user reads.
export async function axeViolations(context: Element = document.body) {
  await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})))
  const { violations } = await axe.run(context, { resultTypes: ['violations'] })
  return violations.map((v) => `${v.id}: ${v.nodes[0]?.target.join(' ')}`)
}
