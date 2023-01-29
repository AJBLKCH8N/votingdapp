import { ethers } from 'ethers'

export default class EthereumService {
    constructor() {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();
    }
  
    async requestAccount() {
      return await this.signer.getAddress();
    }
  
    async getContract(daoAddress, Dao) {
      return new ethers.Contract(daoAddress, Dao.abi, this.signer);
    }
  }
  