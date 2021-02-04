/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService } from '@cloudbeaver/core-sdk';

import { CONNECTION_NAVIGATOR_VIEW_SETTINGS } from './ConnectionNavigatorViewSettings';

@injectable()
export class ConnectionViewService {
  constructor(
    private graphQLService: GraphQLService,
  ) { }

  async changeConnectionView(connectionId: string, simple: boolean): Promise<void> {
    const settings = simple ? CONNECTION_NAVIGATOR_VIEW_SETTINGS.simple : CONNECTION_NAVIGATOR_VIEW_SETTINGS.advanced;

    await this.graphQLService.sdk.setConnectionNavigatorSettings({
      id: connectionId,
      settings,
    });
  }
}