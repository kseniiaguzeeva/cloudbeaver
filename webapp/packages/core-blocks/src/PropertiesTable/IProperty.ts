/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IProperty {
  id: string;
  key: string;
  displayName?: string;
  defaultValue?: string;
  description?: string;
  validValues?: string[];
  new?: boolean;
}
