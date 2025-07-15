// app/global-error.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Result, Button } from "antd";

export default function GlobalError({ error, reset }) {
  const router = useRouter();
  
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
      <Result
        status="error"
        title="Error"
        subTitle="Ocurrió un error inesperado."
        extra={[
          <Button 
            key="retry" 
            type="primary" 
            onClick={() => reset()}
          >
            Intentar nuevamente
          </Button>
        ]}
      />
    </div>
  );
}