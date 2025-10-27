import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../users/jwt/jwt-auth.guard';
import {
  ClientListQueryDto,
  ClientListResponseDto,
} from './dto/client-list.dto';
import { ClientDetailDto } from './dto/client-detail.dto';
import { UpdateClientDto } from './dto/update-client.dto';

/**
 * Controller responsable des endpoints de gestion des clients
 * Accessible aux admins et agents
 */
@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  /**
   * GET /clients
   * Récupère la liste des clients avec pagination et filtres
   */
  @Get()
  async getClients(
    @Query() query: ClientListQueryDto,
  ): Promise<ClientListResponseDto> {
    return this.clientsService.getClients(query);
  }

  /**
   * GET /clients/:id
   * Récupère les détails complets d'un client
   */
  @Get(':id')
  async getClientById(@Param('id') id: string): Promise<ClientDetailDto> {
    return this.clientsService.getClientById(id);
  }

  /**
   * PATCH /clients/:id
   * Met à jour les informations d'un client
   */
  @Patch(':id')
  async updateClient(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ): Promise<ClientDetailDto> {
    return this.clientsService.updateClient(id, dto);
  }

  /**
   * PATCH /clients/:id/toggle-status
   * Bascule le statut d'un client (actif/inactif)
   */
  @Patch(':id/toggle-status')
  @HttpCode(HttpStatus.OK)
  async toggleClientStatus(
    @Param('id') id: string,
  ): Promise<{ statut: boolean; message: string }> {
    return this.clientsService.toggleClientStatus(id);
  }
}

