"use client";

import { Button as HeroButton, Spinner } from "@heroui/react";
import { forwardRef } from "react";

function buttonVariant(color, variant) {
  if (color === "danger") return variant === "flat" ? "danger-soft" : "danger";
  if (variant === "light" || variant === "flat") return "tertiary";
  if (variant === "bordered") return "outline";
  if (variant === "ghost") return "ghost";
  return color === "secondary" ? "secondary" : "primary";
}

const Button = forwardRef(function Button(
  {
    as,
    className,
    color,
    variant,
    size,
    isIconOnly,
    disabled = false,
    isDisabled = false,
    isLoading = false,
    native = false,
    startContent,
    endContent,
    onPress,
    onClick,
    children,
    ...props
  },
  ref,
) {
  const blocked = disabled || isDisabled || isLoading;
  const classes = className ? "app-button " + className : "app-button";
  const contents = (
    <>
      {isLoading ? <Spinner size="sm" aria-hidden="true" /> : startContent}
      {children}
      {endContent}
    </>
  );

  if (native || as) {
    const Element = as || "button";
    const link = as === "a" || Boolean(props.href);
    const elementClasses = native
      ? classes
      : classes + " app-button-link " + (variant === "light" ? "app-button-link-light" : "app-button-link-primary") + (isIconOnly ? " size-10" : " px-4");
    return (
      <Element
        {...props}
        ref={ref}
        className={elementClasses}
        disabled={link ? undefined : blocked}
        aria-disabled={link && blocked ? true : props["aria-disabled"]}
        aria-busy={isLoading || props["aria-busy"]}
        onClick={blocked ? undefined : onClick || onPress}
        {...(link && blocked ? { href: undefined, tabIndex: -1 } : {})}
        data-app-button=""
      >
        {contents}
      </Element>
    );
  }

  return (
    <HeroButton
      {...props}
      ref={ref}
      className={classes}
      variant={buttonVariant(color, variant)}
      size={size}
      isIconOnly={isIconOnly}
      isDisabled={disabled || isDisabled}
      isPending={isLoading}
      onPress={onPress}
      onClick={onClick}
      data-app-button=""
    >
      {contents}
    </HeroButton>
  );
});

export default Button;

