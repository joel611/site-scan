export type NodeRole = 'sun' | 'planet' | 'moon' | 'asteroid'

export interface RoleNode {
  id: string
  depth: number
  community: string | null
  orphan: boolean
  status: number
}

export function computeNodeRoles(nodes: RoleNode[]): Map<string, NodeRole> {
  const roles = new Map<string, NodeRole>()

  for (const n of nodes) {
    if (n.depth === 0) {
      roles.set(n.id, 'sun')
    } else if (n.orphan || n.status !== 200) {
      roles.set(n.id, 'asteroid')
    }
  }

  const candidateNodes = nodes.filter(n => !roles.has(n.id) && n.community != null)
  const allCommunities = new Set(candidateNodes.map(n => n.community as string))

  if (allCommunities.size <= 1) {
    for (const n of nodes) {
      if (!roles.has(n.id)) roles.set(n.id, 'moon')
    }
    return roles
  }

  const communityMinDepth = new Map<string, number>()
  for (const n of candidateNodes) {
    const community = n.community as string
    const cur = communityMinDepth.get(community)
    if (cur === undefined || n.depth < cur) communityMinDepth.set(community, n.depth)
  }

  for (const n of nodes) {
    if (roles.has(n.id)) continue
    if (n.community != null && n.depth === communityMinDepth.get(n.community)) {
      roles.set(n.id, 'planet')
    } else {
      roles.set(n.id, 'moon')
    }
  }

  return roles
}
