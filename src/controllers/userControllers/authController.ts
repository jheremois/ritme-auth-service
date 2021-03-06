import { Request, Response } from 'express';
import { pool } from '../../config/database';
import { userType } from '../../models/interfaces/user.type';
import {passwrdHashing, passwrdCheck} from "../../helpers/fucntions"
import { sign } from 'jsonwebtoken';
import appConfig from "../../config/environments";
const conf = appConfig.passport.JWT

export const register = async (req: Request, res: Response) => {
  
  const { email, password, user_name }: userType = req.body

  email && password && user_name
    ?
    passwrdHashing(password).then((pswrd)=>{
      pool.query('INSERT INTO users SET?',{
        email,
        password: pswrd
      }, (err, response: any)=>{
        err
          ?
            res.status(500).json(
              {
                status: 500,
                data: err
              }
            )
          :
            pool.query('INSERT INTO profiles SET?',{
              user_id: response.insertId,
              user_name: user_name
            }, (profileRes)=>{
              res.json(
                {
                  ProfileRes: profileRes,
                  UserRes: response,
                  status: 200,
                }
              )
            }) 
      })
    })
    :
      res.status(500).json(
        {
          status: 500,
          data: "Fields missing"
        }
      )
}

export const login = async (req: Request, res: Response) => {

  const { email, password }: userType = req.body

  email && password
    ?(
      pool.query(`
        SELECT *
        FROM users
        INNER JOIN profiles
        ON users.user_id = profiles.user_id
        WHERE users.email = '${email}'
      `, (err, response: userType[])=>{
        err
          ?
            res.status(500).json(
              {
                status: 500,
                data: err
              }
            )
          :
            response[0]
            ?
              passwrdCheck(res, password, response[0].password).then((validPassword)=>{
                console.log(validPassword)
                
                if (validPassword) {
                  
                  const token = sign({user_id: response[0].user_id, user_name: response[0].user_name}, conf.CLIENT_SECRET, {expiresIn: "1h"})
                  console.log(token)

                  res.status(200).json({ 
                    status: 200,
                    message: "Valid password",
                    data: {
                      user_token: token,
                      user: {
                        email: response[0].email,
                        user_id: response[0].user_id,
                        user_name: response[0].user_name,
                      }
                    }
                  })

                }else{
                  res.status(400).json({ error: "Fields invalid" });
                }
              })
            :
              res.status(400).json({ error: "Fields invalid" });
      })
    )
    :
      res.status(500).json(
        {
          status: 500,
          data: "Fields missing"
        }
      )


}