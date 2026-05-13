import { test, expect, describe } from "bun:test"
import { computeNodeRoles } from "./node-roles"
import type { RoleNode } from "./node-roles"

function node(overrides: Partial<RoleNode> & { id: string }): RoleNode {
  return { depth: 1, community: 'c1', orphan: false, status: 200, ...overrides }
}

describe('computeNodeRoles', () => {
  test('sun: depth === 0', () => {
    const roles = computeNodeRoles([node({ id: 'home', depth: 0 })])
    expect(roles.get('home')).toBe('sun')
  })

  test('asteroid: orphan === true', () => {
    const roles = computeNodeRoles([
      node({ id: 'home', depth: 0 }),
      node({ id: 'a', orphan: true, depth: 2, community: 'c1' }),
      node({ id: 'b', depth: 1, community: 'c1' }),
      node({ id: 'c', depth: 1, community: 'c2' }),
    ])
    expect(roles.get('a')).toBe('asteroid')
  })

  test('asteroid: status !== 200', () => {
    const roles = computeNodeRoles([
      node({ id: 'home', depth: 0 }),
      node({ id: 'dead', status: 404, depth: 2, community: 'c1' }),
      node({ id: 'b', depth: 1, community: 'c1' }),
      node({ id: 'c', depth: 1, community: 'c2' }),
    ])
    expect(roles.get('dead')).toBe('asteroid')
  })

  test('planet: shallowest depth in community', () => {
    const roles = computeNodeRoles([
      node({ id: 'home', depth: 0 }),
      node({ id: 'a', depth: 1, community: 'c1' }),
      node({ id: 'b', depth: 2, community: 'c1' }),
      node({ id: 'c', depth: 1, community: 'c2' }),
    ])
    expect(roles.get('a')).toBe('planet')
    expect(roles.get('b')).toBe('moon')
  })

  test('planet tie: all shallowest in community become planets', () => {
    const roles = computeNodeRoles([
      node({ id: 'home', depth: 0 }),
      node({ id: 'a', depth: 1, community: 'c1' }),
      node({ id: 'b', depth: 1, community: 'c1' }),
      node({ id: 'deeper', depth: 2, community: 'c1' }),
      node({ id: 'c', depth: 1, community: 'c2' }),
    ])
    expect(roles.get('a')).toBe('planet')
    expect(roles.get('b')).toBe('planet')
    expect(roles.get('deeper')).toBe('moon')
  })

  test('multi-community: each community gets its own planet', () => {
    const roles = computeNodeRoles([
      node({ id: 'home', depth: 0 }),
      node({ id: 'a', depth: 1, community: 'c1' }),
      node({ id: 'b', depth: 2, community: 'c1' }),
      node({ id: 'c', depth: 1, community: 'c2' }),
      node({ id: 'd', depth: 3, community: 'c2' }),
    ])
    expect(roles.get('a')).toBe('planet')
    expect(roles.get('b')).toBe('moon')
    expect(roles.get('c')).toBe('planet')
    expect(roles.get('d')).toBe('moon')
  })

  test('single community: all non-sun nodes become moons', () => {
    const roles = computeNodeRoles([
      node({ id: 'home', depth: 0 }),
      node({ id: 'a', depth: 1, community: 'c1' }),
      node({ id: 'b', depth: 2, community: 'c1' }),
    ])
    expect(roles.get('home')).toBe('sun')
    expect(roles.get('a')).toBe('moon')
    expect(roles.get('b')).toBe('moon')
  })

  test('dead page overrides planet candidacy', () => {
    const roles = computeNodeRoles([
      node({ id: 'home', depth: 0 }),
      node({ id: 'dead', depth: 1, community: 'c1', status: 500 }),
      node({ id: 'alive', depth: 1, community: 'c1' }),
      node({ id: 'c', depth: 1, community: 'c2' }),
    ])
    expect(roles.get('dead')).toBe('asteroid')
    expect(roles.get('alive')).toBe('planet')
  })

  test('null community node becomes moon', () => {
    const roles = computeNodeRoles([
      node({ id: 'home', depth: 0 }),
      node({ id: 'a', depth: 1, community: null }),
      node({ id: 'b', depth: 1, community: 'c1' }),
      node({ id: 'c', depth: 1, community: 'c2' }),
    ])
    expect(roles.get('a')).toBe('moon')
  })
})
