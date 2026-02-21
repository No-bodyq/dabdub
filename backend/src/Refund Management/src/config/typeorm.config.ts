import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { Refund } from "../modules/refunds/entities/refund.entity";
import { Settlement } from "../modules/settlements/entities/settlement.entity";
import { AuditLog } from "../modules/audit/entities/audit-log.entity";

export const typeormConfig: TypeOrmModuleOptions = {
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "refund_db",
  entities: [Refund, Settlement, AuditLog],
  synchronize: process.env.NODE_ENV !== "production",
  logging: process.env.NODE_ENV === "development",
  dropSchema: false,
};
