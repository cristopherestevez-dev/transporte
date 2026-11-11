"use client";

import { Button as HeroButton } from "@heroui/react";
import { forwardRef } from "react";

const Button = forwardRef(function Button(
  {
    as,
    className,
    color,
    variant,
    disabled = false,
    isDisabled = false,
    isLoading = false,
    native = false,
    ...props
  },
  ref,
) {
  const blocked = disabled || isDisabled || isLoading;
  const classes = className ? "app-button " + className : "app-button";

  if (native) {
    const Element = as || "button";
    return (
      <Element
        {...props}
        ref={ref}
        className={classes}
        disabled={as === "a" ? undefined : blocked}
        aria-disabled={as === "a" && blocked ? true : props["aria-disabled"]}
        aria-busy={isLoading || props["aria-busy"]}
        {...(as === "a" && blocked ? { href: undefined, onClick: undefined, tabIndex: -1 } : {})}
        data-app-button=""
      />
    );
  }

  return (
    <HeroButton
      {...props}
      as={as}
      ref={ref}
      className={classes}
      color={color ?? (variant ? undefined : "primary")}
      variant={variant}
      isDisabled={blocked}
      isLoading={isLoading}
      data-app-button=""
    />
  );
});

export default Button;
