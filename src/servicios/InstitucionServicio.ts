import { Conector } from "../conexiones/Conexion";
import HttpRequestError from "../errores/HttpRequestError";
import { Institucion } from "../modelos/Institucion";
import {getConnection} from "typeorm";
import { Uge } from "../modelos/Uge";
import Interceptor from "../interceptor/Interceptor";
import { TipoInternacion } from "../modelos/TipoInternacion";


export class InstitucionService {

    constructor() {}

    public obtenerInstituciones = async (paginado:any) => {
        let conexion = await this.obtenerRepositorio();
        const institucionRepositorio = conexion.getRepository(Institucion);
        const res = await institucionRepositorio.createQueryBuilder("institucion")

        .limit(paginado.limit)
        .offset(paginado.offset)
        .orderBy("institucion.id" , "ASC")
        .getManyAndCount();
        
        return res;
    }

    public obtenerInstitucionPorID = async (emplooyeID:number) => {
        let conexion = await this.obtenerRepositorio();
        const institucionRepositorio = conexion.getRepository(Institucion);
        const res = await institucionRepositorio.findOne(emplooyeID);
        return res;
    }

    public insertarInstituciones = async (instituciones:any []) => {      
        let conexion = await this.obtenerRepositorio();
        let response: any = {};
        try {
            response = await getConnection(conexion.name).transaction(async transactionalEntityManager => {
                for (let i  = 0; i < instituciones.length; i++) {
                    let institucion = instituciones[i];
                    const exist = await transactionalEntityManager.getRepository(Institucion).findOne({prestador: institucion.prestador});
                    if (!exist){
                      let responseInstitucion = await transactionalEntityManager.getRepository(Institucion)
                      .save(institucion);    
                    }
                }
            });      
        } catch (error) {
            console.log(error);
            throw new HttpRequestError(HttpRequestError.ERROR_TYPE + " " + error);
        }  
        return response;  
    }

    public obtenerUges = async () => {
        let conexion = await this.obtenerRepositorio();
        const ugeRepositorio = conexion.getRepository(Uge);
        const res = await ugeRepositorio.find({order: {nombre : 'ASC'}});
        return res;
    }

    public obtenerAuditoriasPorInstitucion = async (institucionID: number) => {
        let conexion = await this.obtenerRepositorio();
        const tiposRepositorio = conexion.getRepository(TipoInternacion);
        const query = tiposRepositorio.createQueryBuilder("tipoInternacion")
        const auditorias =  
        query.innerJoinAndSelect("tipoInternacion.auditorias" , "auditoria")
        .innerJoin("auditoria.institucion" , "institucion")
        .leftJoinAndSelect('auditoria.asignaciones', 'asignacion')
        .leftJoinAndSelect('asignacion.usuario', 'usuarios')
        .innerJoinAndSelect('auditoria.paciente', 'paciente')
        .where("institucion.id = :id" , {id : institucionID})        
        .getMany();        
        
        return auditorias;
    }

    private obtenerRepositorio = async () => {
        return await Conector.obtenerConexion();
    }
}