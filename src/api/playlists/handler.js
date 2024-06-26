const AutoBind = require('auto-bind')

class PlaylistsHandler {
  constructor (songService, playlistsService, validator) {
    this._songService = songService
    this._playlistsService = playlistsService
    this._validator = validator
    AutoBind(this)
  }

  async postPlaylistHandler (request, h) {
    this._validator.validatePlaylistsPayload(request.payload)

    const { name } = request.payload
    const { id: credentialId } = request.auth.credentials

    const playlistId = await this._playlistsService.addPlaylist(name, credentialId)

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil dibuat',
      data: {
        playlistId
      }
    })
    response.code(201)
    return response
  }

  async getPlaylistsHandler (request, h) {
    const { id: credentialId } = request.auth.credentials
    const playlists = await this._playlistsService.getPlaylists(credentialId)

    const response = h.response({
      status: 'success',
      data: {
        playlists: playlists.data
      }
    })
    if (playlists.isCache) response.header('X-Data-Source', 'cache')
    return response
  }

  async deletePlaylistByIdHandler (request) {
    const { id: credentialId } = request.auth.credentials
    const { id: playlistId } = request.params

    await this._playlistsService.verifyPlaylistOwner(playlistId, credentialId)
    await this._playlistsService.deletePlaylist(playlistId, credentialId)
    return {
      status: 'success',
      message: 'Playlist berhasil dihapus'
    }
  }

  async postPlaylistSongHandler (request, h) {
    this._validator.validatePlaylistSongsPayload(request.payload)

    const { id: playlistId } = request.params
    const { songId } = request.payload

    const { id: credentialId } = request.auth.credentials
    await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId)
    await this._songService.verifySongExist(songId)

    await this._playlistsService.addPlaylistSong(playlistId, songId)
    await this._playlistsService.addPlaylistSongActivity(playlistId, songId, credentialId, 'add')
    const response = h.response({
      status: 'success',
      message: 'Berhasil menambahkan lagu ke playlist'
    })
    response.code(201)
    return response
  }

  async getPlaylistSongsHandler (request) {
    const { id: playlistId } = request.params

    const { id: credentialId } = request.auth.credentials
    await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId)

    const playlist = await this._playlistsService.getPlaylistById(playlistId)
    const songs = await this._songService.getSongsOnPlaylist(playlistId)
    return {
      status: 'success',
      data: {
        playlist: { ...playlist, songs }
      }
    }
  }

  async deletePlaylistSongsHandler (request) {
    this._validator.validatePlaylistSongsPayload(request.payload)
    const { id: playlistId } = request.params
    const { songId } = request.payload

    const { id: credentialId } = request.auth.credentials
    await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId)
    await this._songService.verifySongExist(songId)

    await this._playlistsService.deletePlaylistSong(playlistId, songId)
    await this._playlistsService.addPlaylistSongActivity(playlistId, songId, credentialId, 'delete')
    return {
      status: 'success',
      message: 'Lagu berhasil dihapus dari playlist'
    }
  }

  async getPlaylistSongActivitiesHandler (request, h) {
    const { id: playlistId } = request.params

    const { id: credentialId } = request.auth.credentials
    await this._playlistsService.verifyPlaylistAccess(playlistId, credentialId)

    const playlist = await this._playlistsService.getPlaylistById(playlistId)
    const activities = await this._playlistsService.getPlaylistSongActivity(playlistId)
    const response = h.response({
      status: 'success',
      data: {
        playlistId: playlist.id,
        activities: activities.data
      }
    })
    if (activities.isCache) response.header('X-Data-Source', 'cache')
    return response
  }
}

module.exports = PlaylistsHandler
