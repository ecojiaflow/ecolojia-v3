import React from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

export const TrendSparkline: React.FC<{data:{date:string; value:number}[]}> = ({ data }) => {
  return (
    <div className="w-full h-16">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" dot={false} strokeWidth={2}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
