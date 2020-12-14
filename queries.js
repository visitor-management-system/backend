const Pool = require("pg").Pool;
const { uuid } = require("uuidv4");
const pool = new Pool({
  user: "iamuser",
  host: "localhost",
  database: "visitordb",
  password: "password",
  port: 5432
});

const addVisitorEntry = (req, resp) => {
  const { fname, lname, phno, intime } = req.body;
  pool.query(`SELECT * FROM visitor_master WHERE (fname = $1 AND lname = $2 AND phno = $3)`,[fname,lname,phno],async(err,res)=>{
    if(err) throw err;
    let myvid = uuid();
    if(!res.rowCount) {
      await pool.query(`INSERT INTO visitor_master VALUES('${myvid}','${fname}','${lname}','${phno}')`,(err1,res1)=>{
        if(err1) throw err1;
      });
    }
    else {
      myvid = res.rows[0]._vid;
    }
    pool.query(`SELECT * FROM visitor_log WHERE (_vid = $1 AND outtime = 'VOID')`,[myvid],(err3,res3)=>{
      if(err3) throw err3;
      if(res3.rowCount)
        resp.status(200).json("Visitor is already inside");
      else
        pool.query(`INSERT INTO visitor_log VALUES('${myvid}','${intime}','VOID')`,(err2,res2)=>{
          if(err2) throw err2;
          resp.status(200).json("success");
        });
    })
  })
}

const getvisitors = (request, response) => {
  const { srchParam } = request.params;
  pool.query(`SELECT * FROM visitor_master WHERE (fname = $1 OR phno = $1)`,[srchParam], (error, results) => {
    if (error) {
      throw error;
    }
    response.status(200).json(results.rows);
  });
};

const getLogs = (req,resp) => {
  const { startTs, endTs, phno } = req.params;
  const qry1 = "SELECT * FROM visitor_master INNER JOIN visitor_log ON visitor_master._vid = visitor_log._vid";
  pool.query(qry1,(err,res)=>{
    if(err) throw err;
    let ans = [];
    res.rows.forEach(rec=>{
      if(Number(rec.intime)>=startTs && Number(rec.intime)<=endTs && rec.phno == phno)
        ans.push(rec);
    });
    resp.status(200).json(ans);
  })
}

const setVisitorExit = (req,resp) => {
  const { fname, lname, phno, outtime } = req.body;
  pool.query("SELECT * FROM visitor_master WHERE (fname = $1 AND lname = $2 AND phno = $3)",[fname,lname,phno],(err,res)=>{
    if(err) throw err;
    if(!res.rowCount) {resp.status(200).json("Visitor never came")}
    else {
      pool.query(`SELECT * FROM visitor_log WHERE (_vid = '${res.rows[0]._vid}' AND outtime = 'VOID')`,(err1,res1)=>{
        if(err1) throw err1;
        if(!res1.rowCount) {resp.status(200).json("Visitor has already exited")}
        else if(res1.rows[0].intime > outtime) {resp.status(200).json("Visitor can't exit before entering.")}
        else {
          pool.query(`UPDATE visitor_log SET outtime = '${outtime}' WHERE (_vid = '${res.rows[0]._vid}' AND outtime = 'VOID')`,(err2,res2)=>{
            if(err2) throw err2;
            resp.status(200).json("success");
          })
        }
      })
    }
  })
}

module.exports = {
  getvisitors,
  addVisitorEntry,
  getLogs,
  setVisitorExit
};
