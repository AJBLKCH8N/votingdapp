import './App.css';
import { useState, useEffect } from 'react';
import Dao from './artifacts/contracts/Dao.sol/Dao.json'
import EthereumService from './services/ethereum.service';

const daoAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
const ethereumService = new EthereumService(); 

function App() {
  const[id, setId] = useState()
  const[description, setDescription] = useState()
  const[vote, setVote] = useState()
  const[count, setCount] = useState()
  const [proposalId, setProposalId] = useState()
  const [proposals, setProposals] = useState([])

  async function createProposal() {
    if (!description) return
    if (typeof window.ethereum !== 'undefined') {
      await ethereumService.requestAccount();
      const contract = await ethereumService.getContract(daoAddress, Dao);
      const transaction = await contract.createProposal(description)
      await transaction.wait()
    }
  }

  async function getProposal(proposalId) {
    if (!proposalId) return // check that proposalId is not empty
    if (typeof window.ethereum !== 'undefined') {
      await ethereumService.requestAccount();
      const contract = await ethereumService.getContract(daoAddress, Dao);
      try {
        //this gets the Proposals mapping from the smart contract
        const proposal = await contract.functions.Proposals(proposalId);
        console.log(proposal);
      } catch (err) {
        console.log(err);
      }
    }
  }


  async function voteOnProposal(id, vote) {
    if (!id || !vote) return;
    if (typeof window.ethereum !== 'undefined') {
      await ethereumService.requestAccount();
      const contract = await ethereumService.getContract(daoAddress, Dao);

        //check that the deadline hasnt passed
        const deadline = await contract.functions.Proposals(id).deadline();
        if (deadline < await ethereumService.provider.getBlockNumber()) {
            throw new Error("The deadline has passed for this Proposal");
        }
        
        //check that the user hasnt voted yet on the proposal
        const voteStatus = await contract.functions.Proposals(id).voteStatus(ethereumService.signer.address);
        if (voteStatus) {
          throw new Error("You have already voted on this Proposal");
        }

        //check that the proposal even exists
        const proposalExists = await contract.functions.Proposals(id).exists();
        if (!proposalExists) {
            throw new Error("This Proposal does not exist");
        }

        //call the smart contract method, parsing the two arguments, vote ID and Vote
        const transaction = await contract.voteOnProposal(id, vote);
        await transaction.wait();
        }
      }
    
    async function countVotes() {
      if (!id) return
      if (typeof window.ethereum !== 'undefined') {
        await ethereumService.requestAccount();
        const contract = await ethereumService.getContract(daoAddress, Dao);
  
        //check that the caller is the contract owner
        const contractOwner = await contract.functions.contractOwner(ethereumService.signer.address);
        if (!contractOwner) {
          throw new Error("You are not the Contract Owner. Only the Contract Owner can count votes");
        }

        //check that the proposal exists
        const proposalExists = await contract.functions.Proposals(id).exists();
        if (!proposalExists) {
            throw new Error("This Proposal does not exist");
        }

        //make sure that the voting hasnt concluded yet
        const deadline = await contract.functions.Proposals(id).deadline();
        if (deadline > await ethereumService.provider.getBlockNumber()) {
            throw new Error("Voting has not yet concluded. You still have time until all voting is finished");
        }

        //call the method and parse the id of the proposal into the countVotes function
        const transaction = await contract.countVotes(id)
        await transaction.wait()
      }
    }

    useEffect(() => {
      async function fetchData() {
      await ethereumService.requestAccount();
      const contract = await ethereumService.getContract(daoAddress, Dao);
        try {
          let proposalsArray = [];
          const nextProposal = await contract.nextProposal(); // get the value of the nextProposal variable
          for (let i = 1; i < nextProposal; i++) {
            const proposal = await contract.Proposals(i); // get the proposal at the given index in the Proposals mapping
            const proposalData = {
              id: proposal.id.toNumber(),
              description: proposal.description,
              deadline: proposal.deadline.toNumber(),
              votesUp: proposal.votesUp.toNumber(),
              votesDown: proposal.votesDown.toNumber(),
              passed: proposal.passed
            };
            proposalsArray.push(proposalData);
          }
          setProposals(proposalsArray); // set the proposals to the state
        } catch (error) {
          console.error(error);
        }
      }
      fetchData();
    }, [proposals]);

  return (
    <div className="App">
      <div className="left-align">
      <h1>Public DAO</h1>
      <p><em>The DAO for Everyone</em></p>
      </div>
      <h2>
      <form onSubmit={e => {
                e.preventDefault()
                createProposal()
            }} style={{display: "flex", justifyContent: "space-between"}}>
                <input placeholder="Enter proposal description" onChange={e => setDescription(e.target.value)} style={{borderRadius: "20px"}} />
                <button type="submit" style={{borderRadius: "20px", marginLeft: "10px"}}>Create Proposal</button>
            </form>
      </h2>
      <h2>
      <form onSubmit={(event) => {
            event.preventDefault()
            getProposal(event.target.proposalId.value)
        }}>
            <input type="text" name="proposalId" placeholder="Enter Proposal ID" onChange={e => setProposalId(e.target.value)} />
            <button type="submit">Get Proposal</button>
        </form>
      </h2>
      <h3>
        <table>
          <thead>
              <tr>
                  <th>ID</th>
                  <th>Description</th>
                  <th>Deadline</th>
                  <th>Votes Up</th>
                  <th>Votes Down</th>
                  <th>Passed</th>
              </tr>
          </thead>
          <tbody>
              {proposals.map(proposal => (
                  <tr key={proposal.id}>
                      <td>{proposal.id}</td>
                      <td>{proposal.description}</td>
                      <td>{proposal.deadline}</td>
                      <td>{proposal.votesUp}</td>
                      <td>{proposal.votesDown}</td>
                      <td>{proposal.passed ? 'Yes' : 'No'}</td>
                  </tr>
              ))}
          </tbody>
      </table>
      </h3>
      <h3>
      </h3>
    </div>
  );
}


export default App;
