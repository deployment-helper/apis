import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PermissionEntity } from "../entities/permission.entity";
import { Repository } from "typeorm";

@Injectable()
export class PermissionService{
    constructor(
        @InjectRepository(PermissionEntity) private permissionRepository:Repository<PermissionEntity>
    ){}

    findAll():Promise<PermissionEntity[]>{        
        return this.permissionRepository.find();
    }

    findOne(id:number):Promise<PermissionEntity>{
        return this.permissionRepository.findOneBy({id});
    }

    async create(permission:PermissionEntity):Promise<PermissionEntity>{
        await this.permissionRepository.save(permission);
        return permission;
    }

    async remove(id:number):Promise<void>{
        await this.permissionRepository.delete(id);
    }
}