"use client";

import React from "react";
import { StratosBrand } from "./StratosBrand";

export function StratosLogo({ className = "" }: { className?: string }) {
  return <StratosBrand className={className} />;
}

export function Logo({ className = "" }: { className?: string }) {
  return <StratosBrand className={className} />;
}

export default StratosLogo;
