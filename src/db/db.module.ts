import { Injectable, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { createPool } from 'mysql';
import { ConnectionPool } from 'mssql';
import {
  PG_CONNECTION,
  MYSQL_CONNECTION,
  MSSQL_CONNECTION,
} from '../constants';

const pgProvider = {
  provide: PG_CONNECTION,
  useValue: new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'somedb',
    password: 'meh',
    port: 5432,
  }),
};

const mysqlProvider = {
  provide: MYSQL_CONNECTION,
  useValue: new createPool({
    user: 'root',
    host: '172.20.0.2',
    database: 'somedb',
    password: 'root',
    port: 3306,
    connectionLimit: 10,
  }),
};

const mssqlProvider = {
  provide: MSSQL_CONNECTION,
  useValue: new ConnectionPool({
    user: 'sa',
    server: '10.0.2.17',
    database: 'CASA_LIVE',
    password: 'Pass@word',
    port: 1433,
    options: {
      trustedConnection: true,
      encrypt: true,
      enableArithAbort: true,
      trustServerCertificate: true,
    },
  }),
};

@Injectable()
export class dbConnector {
  getConnectionPool(
    user: string,
    server: string,
    database: string,
    password: string,
    port: number,
  ) {
    return new ConnectionPool({
      user: user,
      server: server,
      database: database,
      password: password,
      port: port,
      options: {
        // trustedConnection: true,
        // encrypt: true,
        //   enableArithAbort: true,
        trustServerCertificate: true,
      },
    });
  }
}

@Module({
  providers: [pgProvider, mysqlProvider, mssqlProvider, dbConnector],
  exports: [pgProvider, mysqlProvider, mssqlProvider],
})
export class DbModule {}
