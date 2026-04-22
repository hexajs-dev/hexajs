import React from 'react';
import OriginalDocSidebarItemCategory from '@theme-original/DocSidebarItemCategory';
import type { WrapperProps } from '@docusaurus/types';
import { DOC_ICONS, type DocIconKey } from '@site/src/components/icons/lucide';

type Props = WrapperProps<typeof OriginalDocSidebarItemCategory>;

export default function DocSidebarItemCategory({ item, ...rest }: Props) {
  const iconKey = item.customProps?.icon as DocIconKey | undefined;
  const Icon = iconKey ? DOC_ICONS[iconKey] : undefined;
  const patchedItem = Icon
    ? {
      ...item,
      label: (
        <span className="hexa-sidebar-category-label">
          <Icon size={14} strokeWidth={2} className="hexa-sidebar-category-icon" aria-hidden="true" />
          <span>{item.label}</span>
        </span>
      ) as unknown as string,
    }
    : item;

  return <OriginalDocSidebarItemCategory item={patchedItem} {...rest} />;
}
