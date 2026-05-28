import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { StoredRoute } from "../types/vehicle";

interface MyLocationDB extends DBSchema {
  routes: {
    key: string;
    value: StoredRoute;
  };
}

let dbPromise: Promise<IDBPDatabase<MyLocationDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<MyLocationDB>("mylocation-driver", 1, {
      upgrade(db) {
        db.createObjectStore("routes", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

export async function getAllRoutes(): Promise<StoredRoute[]> {
  const db = await getDB();
  return db.getAll("routes");
}

export async function getRoute(id: string): Promise<StoredRoute | undefined> {
  const db = await getDB();
  return db.get("routes", id);
}

export async function putRoute(route: StoredRoute): Promise<void> {
  const db = await getDB();
  await db.put("routes", route);
}

export async function deleteRoute(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("routes", id);
}
