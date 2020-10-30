/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.cloudbeaver.model;

import io.cloudbeaver.DBWebException;
import io.cloudbeaver.WebServiceUtils;
import io.cloudbeaver.model.session.WebSession;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.DBPDataSourceContainer;
import org.jkiss.dbeaver.model.DBPDataSourceOrigin;
import org.jkiss.dbeaver.model.DBPObject;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.runtime.properties.ObjectPropertyDescriptor;
import org.jkiss.dbeaver.runtime.properties.PropertyCollector;

import java.util.Arrays;
import java.util.Map;

/**
 * Web connection origin info
 */
public class WebConnectionOriginInfo {

    private final WebSession session;
    private final DBPDataSourceContainer dataSourceContainer;
    private final DBPDataSourceOrigin origin;

    public WebConnectionOriginInfo(WebSession session, DBPDataSourceContainer dataSourceContainer, DBPDataSourceOrigin origin) {
        this.session = session;
        this.dataSourceContainer = dataSourceContainer;
        this.origin = origin;
    }

    @NotNull
    public String getType() {
        return origin.getType();
    }

    @NotNull
    public String getDisplayName() {
        return origin.getDisplayName();
    }

    @Nullable
    public String getIcon() {
        return WebServiceUtils.makeIconId(origin.getIcon());
    }

    @NotNull
    public Map<String, Object> getConfiguration() {
        return origin.getConfiguration();
    }

    @Property
    public WebPropertyInfo[] getDetails() throws DBWebException {
        try {
            DBPObject details = origin.getDataSourceDetails(session.getProgressMonitor(), dataSourceContainer);
            PropertyCollector propertyCollector = new PropertyCollector(details, false);
            propertyCollector.collectProperties();
            return Arrays.stream(propertyCollector.getProperties())
                .filter(p -> !(p instanceof ObjectPropertyDescriptor && ((ObjectPropertyDescriptor) p).isHidden()))
                .map(p -> new WebPropertyInfo(session, p)).toArray(WebPropertyInfo[]::new);
        } catch (DBException e) {
            throw new DBWebException("Error reading origin details", e);
        }
    }

}
