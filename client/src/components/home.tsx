import { useState, useEffect } from "react";

export default function Home() {
  const [apiValue, setApiValue] = useState("");

  useEffect(() => {
    const getAPIData = async () => {
      const url = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
      console.log(url);

      const response = await fetch(`${url}/`, {
        method: "GET",
      });

      const data = await response.json();

      setApiValue(data.message);
    };

    getAPIData();
  }, []);

  return (
    <>
      <h1>API Value: </h1>
      <p>{apiValue}</p>
    </>
  );
}
