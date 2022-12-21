import mysql from "mysql2";
import * as dotenv from "dotenv";

dotenv.config();

class SQLConnection {
  private static instance: SQLConnection;
  private connection: mysql.Connection;

  private constructor() {
    this.connection = mysql.createConnection({
      host: process.env.DB_HOST ?? "localhost",
      user: process.env.DB_USER ?? "root",
      password: process.env.DB_PASSWORD ?? "",
      database: process.env.DB_NAME ?? "test",
    });
  }

  public static getInstance(): SQLConnection {
    if (!SQLConnection.instance) {
      SQLConnection.instance = new SQLConnection();
    }

    return SQLConnection.instance;
  }

  public getConnection(): mysql.Connection {
    return this.connection;
  }

  public manualQuery(sql: string, args?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, args, (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  public async select(sql: string, args?: any): Promise<any> {
    const rows = await this.manualQuery(sql, args);
    return rows[0];
  }

  public async selectAll(sql: string, args?: any): Promise<any> {
    const rows = await this.manualQuery(sql, args);
    return rows;
  }

  public async insert(sql: string, args?: any): Promise<any> {
    const rows = await this.manualQuery(sql, args);
    return rows.insertId;
  }

  public async update(sql: string, args?: any): Promise<any> {
    const rows = await this.manualQuery(sql, args);
    return rows.affectedRows;
  }

  public async delete(sql: string, args?: any): Promise<any> {
    const rows = await this.manualQuery(sql, args);
    return rows.affectedRows;
  }

  public closeConnection(): void {
    this.connection.end();
  }
}

export default SQLConnection;
