import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class PermissionEntity{
    @PrimaryGeneratedColumn()
    id:number;
    
    @Column()
    userId:string;
    
    @Column()
    permission:string;
    
    @CreateDateColumn()
    addedAt:Date;
    
    @UpdateDateColumn()
    updatedAt:Date;
}