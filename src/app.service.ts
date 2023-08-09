import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto';
import { dbConnector } from './db/db.module';
import { ConnectionPool } from 'mssql';
@Injectable()
export class AppService {
  dbConnection: ConnectionPool = null;
  constructor(private conn: dbConnector) {
    console.log(
      process.env.MSSQL_USER,
      process.env.MSSQL_SERVER,
      process.env.MSSQL_DATABASE,
      process.env.MSSQL_PASSWORD,
      process.env.MSSQL_PORT,
    );
    this.dbConnection = conn.getConnectionPool(
      process.env.MSSQL_USER,
      process.env.MSSQL_SERVER,
      process.env.MSSQL_DATABASE,
      process.env.MSSQL_PASSWORD,
      parseInt(process.env.MSSQL_PORT),
    );
  }

  // async mysqlCallStoredProcedure(msg: string) {
  //returns a promise that resolves to a result set on success
  //   const execSql = (statement) => {
  //     const p = new Promise((res, rej) => {
  //       this.conn.query(statement, function (err, result) {
  //         if (err) rej(err);
  //         else res(result);
  //       });
  //     });
  //     return p;
  //   };
  //   const res = await execSql('call getTest()');
  //   return res;
  // }

  async mssqlCallStoredProcedure(username: string) {
    //returns a promise that resolves to a result set on success
    const db = await this.dbConnection.connect();
    const res = await db.query(`EXEC get_user  @Username = N'${username}'`);
    console.log(res);
    return { pass: res['recordset'][0]['Password'] };
  }

  parseQueryResponse(res) {
    const nres = [];
    res.recordset.forEach((element) => {
      delete element.Password;
      delete element.IsActive;
      delete element.CreatedBy;
      delete element.LastModifiedBy;
      delete element.LastModifiedOn;
      delete element.UserKey;
      delete element.Code;
      delete element.UserType;
      delete element.CreatedOn;
      delete element.PasswordIsModified;

      const [firstName, lastName] = element.Name.split(' ');
      element.FirstName = firstName;
      element.lastName = lastName;

      const lowerCase = (str) => str[0].toLowerCase() + str.slice(1);
      const nelement = Object.fromEntries(
        Object.entries(element).map(([k, v]) => [lowerCase(k), v]),
      );
      nelement.roles = ['USER'];
      nres.push(nelement);
    });
    return nres;
  }

  async getUsers(search: string, first: number, max: number) {
    const db = await this.dbConnection.connect();
    const res = this.parseQueryResponse(
      await db.query(`SELECT * FROM upsmfac_casa.dbo.Master_user`),
    );
    return res;
  }

  async getUsersCount() {
    const db = await this.dbConnection.connect();
    const res = await db.query(
      `SELECT COUNT(UserKey) as count FROM Master_user`,
    );
    return res.recordset[0].count;
  }

  async getUserById(username: string) {
    const db = await this.dbConnection.connect();
    const res = this.parseQueryResponse(
      await db.query(
        `SELECT * FROM upsmfac_casa.dbo.Master_user where username = N'${username}'`,
      ),
    );
    return res[0];
  }

  async getUserCredentials(username: string) {
    const db = await this.dbConnection.connect();
    const res = await db.query(
      `SELECT * FROM upsmfac_casa.dbo.Master_user where username = N'${username}'`,
    );
    const saltRounds = 1000;
    const cred_res = [];
    res.recordset.forEach((ele) => {
      // const salt = bcrypt.genSaltSync(saltRounds);
      const salt = CryptoJS.randomBytes(32);
      const hash = CryptoJS.pbkdf2Sync(
        ele.Password,
        salt,
        saltRounds,
        64,
        'sha256',
      );
      // const hash = bcrypt.hashSync(ele.Password, salt);
      cred_res.push({
        value: hash.toString('base64'),
        salt: salt.toString('base64'),
        algorithm: 'pbkdf2-sha256',
        iterations: saltRounds,
        type: 'password',
      });
    });
    return cred_res[0];
  }

  async getTutorById(id: string) {
    const db = await this.dbConnection.connect();
    const res = await db.query(
      `Select * from upsmfac_casa.dbo.Master_Tutor_Basic_Info where TutorKey='${id}'`,
    );
    return res.recordset[0];
  }

  async getStudentById(id: string) {
    const db = await this.dbConnection.connect();
    const res = await db.query(
      `Select * from upsmfac_casa.dbo.Master_StudentProfile where StudentProfileKey='${id}'`,
    );
    return res.recordset[0];
  }
async getStudentRegistrationCertificateByRollnumberFromCasa(id: string) {
      const db = await this.dbConnection.connect();
      const res = await db.query(`select  t4.Address as collegeAddress , t5.Title_Registration as NameRegistration, t1.EnrollmentNo as registrationNo, t1.StudentFullName as Name, t1.MotherFullName as mothersName, t1.FatherFullName as fathersName, t1.Gender as gender, t1.ContactNo as mobile, t1.EmailId as email, t1.Address as address, t1.DateOfBirth as dob, t1.District as place, t1.AdmissionDate as dated,  t4.ProposedCenterName as trainingCenter, t1.RollNo as rollNumber, t4.Code as centerCode, t1.CenterKey as centerKey, t3.FinalYearRollNo as finalYearRollNo, t3.JoiningMM as JoiningMonth, t3.JoiningYYYY as JoiningYear, t3.PassingMM as passingMonth , t3.PassingYYYY as passingYear ,t6.Name as examBody, t5.Duration_Month as durationMonth, t5.Duration_Year as durationYear, t3.RegdUnderPart as regPart, t2.RegistrationNo as refNo, t5.Name as courseName,  t2.RegistrationDate from Master_StudentProfile t1 join Master_StudentProfile_Registration t2 on t1.StudentProfileKey = t2.StudentProfileKey join Master_StudentProfile_Registration_UPSMF_MidWife t3 on t2.RegisteredStudentProfileKey = t3.RegisteredStudentProfileKey join Master_CollegeRegistration t4 on t1.CenterKey = t4.CollegeRegistrationKey  join Master_Course t5 on t1.CourseKey = t5.CourseKey join Master_University_StudentRegistration t6 on t3.UniversityKey = t6.University_StudentRegistrationKey where t1.RollNo ='${id}'`,
      );
      return res.recordset[0];
    }

    async getStudentRegistrationCertificateByEnrollmentnumberFromCasa(id: string) {
          const db = await this.dbConnection.connect();
          const res = await db.query(`select  t4.Address as collegeAddress , t5.Title_Registration as NameRegistration, t1.EnrollmentNo as registrationNo, t1.StudentFullName as Name, t1.MotherFullName as mothersName, t1.FatherFullName as fathersName,t1.Gender as gender,t1.ContactNo as mobile,t1.EmailId as email, t1.Address as address, t1.DateOfBirth as dob, t1.District as place, t1.AdmissionDate as dated,  t4.ProposedCenterName as trainingCenter,  t4.Code as centerCode, t1.RollNo as rollNumber, t1.CenterKey as centerKey,t3.FinalYearRollNo as finalYearRollNo, t3.JoiningMM as JoiningMonth, t3.JoiningYYYY as JoiningYear, t3.PassingMM as passingMonth , t3.PassingYYYY as passingYear ,t6.Name as examBody, t5.Duration_Month as durationMonth, t5.Duration_Year as durationYear, t3.RegdUnderPart as regPart, t2.RegistrationNo as refNo,  t5.Name as courseName, t2.RegistrationDate from Master_StudentProfile t1 join Master_StudentProfile_Registration t2 on t1.StudentProfileKey = t2.StudentProfileKey join Master_StudentProfile_Registration_UPSMF_MidWife t3 on t2.RegisteredStudentProfileKey = t3.RegisteredStudentProfileKey join Master_CollegeRegistration t4 on t1.CenterKey = t4.CollegeRegistrationKey  join Master_Course t5 on t1.CourseKey = t5.CourseKey join Master_University_StudentRegistration t6 on t3.UniversityKey = t6.University_StudentRegistrationKey where t1.EnrollmentNo ='${id}'`,
          );
          return res.recordset[0];
       }
}
