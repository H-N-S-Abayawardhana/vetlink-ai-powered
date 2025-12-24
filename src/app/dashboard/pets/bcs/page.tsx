import React from "react";
import BCSCalculator from "@/components/dashboard/bcs/BCSCalculator";

export const metadata = {
  title: "BCS Calculator",
};

export default function Page() {
  return (
    <div className="p-4">
      <BCSCalculator />
    </div>
  );
}
