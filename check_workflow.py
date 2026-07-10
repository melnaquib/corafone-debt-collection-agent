#!/usr/bin/env python3
import json

with open('agent_configs/inbound_collect.json', 'r') as f:
    data = json.load(f)

# Check disclosure_identity node
print("=== DISCLOSURE_IDENTITY NODE ===")
node = data['workflow']['nodes']['disclosure_identity']
print(f"Label: {node['label']}")
print(f"Entry behavior: {node.get('entry_behavior')}")
print(f"Prompt: {node['additional_prompt']}")

edges = [e for e in data['workflow']['edges'].values() if e['source'] == 'disclosure_identity']
print(f"\nOutgoing edges ({len(edges)}):")
for e in edges:
    cond = e['forward_condition']
    print(f"  -> {e['target']}: {cond['type']}", end="")
    if 'condition' in cond:
        print(f" - {cond['condition']}")
    else:
        print()

# Check validate_floor nodes
print("\n=== VALIDATE_FLOOR NODES ===")
for node_id in ['validate_floor', 'validate_floor_2']:
    if node_id in data['workflow']['nodes']:
        node = data['workflow']['nodes'][node_id]
        print(f"\n{node['label']}:")
        print(f"  Prompt: {node['additional_prompt'][:100]}...")

        edges = [e for e in data['workflow']['edges'].values() if e['source'] == node_id]
        print(f"  Outgoing edges ({len(edges)}):")
        for e in edges:
            cond = e['forward_condition']
            print(f"    -> {e['target']}: {cond['type']}", end="")
            if 'condition' in cond:
                print(f" - {cond['condition']}")
            else:
                print()

# Check start node
print("\n=== START NODE ===")
start_edges = [e for e in data['workflow']['edges'].values() if e['source'] == 'start_node']
print(f"Start node routes to: {start_edges[0]['target']}")
