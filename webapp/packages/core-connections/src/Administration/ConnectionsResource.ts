/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService,
  ConnectionInfo,
  ConnectionConfig,
  CachedMapResource,
  ResourceKey,
  isResourceKeyList,
  AdminConnectionGrantInfo,
} from '@cloudbeaver/core-sdk';
import { uuid, MetadataMap } from '@cloudbeaver/core-utils';

const NEW_CONNECTION_SYMBOL = Symbol('new-connection');
type ConnectionNew = ConnectionInfo & { [NEW_CONNECTION_SYMBOL]: boolean }

@injectable()
export class ConnectionsResource extends CachedMapResource<string, ConnectionInfo> {
  private metadata: MetadataMap<string, boolean>;
  constructor(private graphQLService: GraphQLService) {
    super(new Map());
    this.metadata = new MetadataMap(() => false);
  }

  has(id: string) {
    if (this.metadata.has(id)) {
      return this.metadata.get(id);
    }

    return this.data.has(id);
  }

  isNew(id: string) {
    if (!this.has(id)) {
      return false;
    }
    return NEW_CONNECTION_SYMBOL in this.get(id)!;
  }

  addNew() {
    const connectionInfo = {
      id: `new-${uuid()}`,
      name: 'New connection',
      [NEW_CONNECTION_SYMBOL]: true,
    } as ConnectionNew;

    this.data.set(connectionInfo.id, connectionInfo);
    this.markUpdated(connectionInfo.id);

    return connectionInfo;
  }

  async loadAll() {
    await this.load('all');
    return this.data;
  }

  async create(config: ConnectionConfig, id?: string) {
    const { connection } = await this.graphQLService.gql.createConnectionConfiguration({ config });

    if (id) {
      this.data.delete(id);
    }
    this.set(connection.id, connection as ConnectionInfo);

    return this.get(connection.id)!;
  }

  async update(id: string, config: ConnectionConfig) {
    await this.performUpdate(id, async () => {
      await this.setActivePromise<void>(id, this.updateConnection(id, config));
    });
    return this.get(id)!;
  }

  async delete(key: ResourceKey<string>) {
    if (isResourceKeyList(key)) {
      for (let i = 0; i < key.list.length; i++) {
        this.data.delete(key.list[i]);
        if (!this.isNew(key.list[i])) {
          await this.graphQLService.gql.deleteConnectionConfiguration({ id: key.list[i] });
        }
      }
    } else {
      this.data.delete(key);
      if (!this.isNew(key)) {
        await this.graphQLService.gql.deleteConnectionConfiguration({ id: key });
      }
    }
    this.markUpdated(key);
    this.itemDeleteSubject.next(key);
  }

  async loadAccessSubjects(connectionId: string): Promise<AdminConnectionGrantInfo[]> {
    if (this.isNew(connectionId)) {
      return [];
    }

    const { subjects } = await this.graphQLService.gql.getConnectionAccess({ connectionId });

    return subjects;
  }

  async setAccessSubjects(connectionId: string, subjects: string[]) {
    await this.graphQLService.gql.setConnectionAccess({ connectionId, subjects });
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, ConnectionInfo>> {
    const { connections } = await this.graphQLService.gql.getConnections();
    this.data.clear();

    for (const connection of connections) {
      this.set(connection.id, connection as ConnectionInfo);
    }
    this.markUpdated(key);

    // TODO: getConnections must accept connectionId, so we can update some connection or all connections,
    //       here we should check is it's was a full update
    this.metadata.set('all', true);

    return this.data;
  }

  private async updateConnection(id: string, config: ConnectionConfig) {
    const { connection } = await this.graphQLService.gql.updateConnectionConfiguration({ id, config });

    this.set(id, connection as ConnectionInfo);
  }
}