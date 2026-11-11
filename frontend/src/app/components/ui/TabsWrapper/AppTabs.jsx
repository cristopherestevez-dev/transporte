"use client";

import { Children } from "react";
import { Tabs } from "@heroui/react";

export function AppTab() {
  return null;
}

export function AppTabs({ selectedKey, onSelectionChange, variant, className, classNames = {}, children, "aria-label": label = "Secciones" }) {
  const tabs = Children.toArray(children);
  return (
    <Tabs selectedKey={selectedKey} onSelectionChange={onSelectionChange} variant={variant === "underlined" ? "secondary" : "primary"} className={className}>
      <Tabs.ListContainer>
        <Tabs.List aria-label={label} className={classNames.tabList}>
          {tabs.map(({ key, props }) => {
            const id = props.id;
            return (
              <Tabs.Tab id={id} key={key} className={classNames.tab}>
                <span className={classNames.tabContent}>{props.title}</span>
                <Tabs.Indicator className={classNames.cursor} />
              </Tabs.Tab>
            );
          })}
        </Tabs.List>
      </Tabs.ListContainer>
      {tabs.map(({ key, props }) => (
        <Tabs.Panel id={props.id} key={key}>
          {props.children}
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}
