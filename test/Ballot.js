var ballot = artifacts.require("Ballot.sol");
var instance;
var chairPersonAddress;

async function assertThrowsAsync(promise, error) {
    let f = () => {};
    try {
        await promise;
    } catch (e) {
        f = () => {
            throw e;
        };
    } finally {
        assert.throws(f, error);
    }
}


before(async function () {
        instance = await ballot.deployed();
        chairPersonAddress = await instance.chairperson.call();
});

contract('Ballot', async function(accounts) {

    it("The chairperson should be the account that created the contract", async function() {
        assert.equal(chairPersonAddress, accounts[0], "chairpeson is not who was expected to be.");
    });

    it("A voter can not vote if it is not authorized by the chairperson", async function() {
        let voter = accounts[9];
        let proposalToVote = 1;
        let proposalBefore = await instance.proposals.call(proposalToVote);
        await assertThrowsAsync(instance.vote(proposalToVote, {from: voter}), Error);
        let proposalAfter = await instance.proposals.call(proposalToVote);
        assert.equal(proposalBefore[1].toNumber(), proposalAfter[1].toNumber(),
            "The number of votes has changed.");

        let voterData = await instance.voters.call(voter);
        assert.equal(voterData[1], false, "The voter was marked as if it had already voted.");
    });

    it("A voter can not give right to vote to itself", async function () {
        let voter = accounts[9];
        await assertThrowsAsync(instance.giveRightToVote(voter, {from: voter}), Error);
        let voterData = await instance.voters.call(voter);
        assert.equal(voterData[0].toNumber(), 0, "The weight of the voter is higher than 0.");
    });

    it("The chairperson can give the right to vote", async function () {
        let voter = accounts[8];
        await instance.giveRightToVote(voter, {from: chairPersonAddress});
        let voterData = await instance.voters.call(voter);
        expect(voterData[0].toNumber()).to.be.at.most(1);
    });

    it("A voter can vote only if it is authorized by the chairperson", async function () {
        let voter = accounts[7];
        let proposalToVote = 1;
        await instance.giveRightToVote(voter, {from: chairPersonAddress});

        let proposalBefore = await instance.proposals.call(proposalToVote);
        await instance.vote(proposalToVote, {from: voter});
        let proposalAfter = await instance.proposals.call(proposalToVote);

        assert.equal(proposalAfter[1].toNumber(), proposalBefore[1].toNumber() + 1,
            "The number of votes of the proposal was not incremented.");
    });

    it("An authorized voter can only vote once", async function () {
        let voter = accounts[6];
        let proposalToVote = 0;
        await instance.giveRightToVote(voter, {from: chairPersonAddress});

        let proposalBefore = await instance.proposals.call(proposalToVote);
        await instance.vote(proposalToVote, {from: voter});
        await assertThrowsAsync(instance.vote(proposalToVote, {from: voter}), Error);
        let proposalAfter = await instance.proposals.call(proposalToVote);

        assert.equal(proposalAfter[1].toNumber(), proposalBefore[1].toNumber() + 1,
            "The number of votes of the proposal was not the expected.");
    });

    it("The winning proposal should have more votes than the rest", async function () {
        let voters = [accounts[1], accounts[2], accounts[3], accounts[4]];
        let expectedWinningProposal = 0;

        //give right to vote to these voters and make all them vote proposal 0
        voters.forEach(async function(voter) {
            await instance.giveRightToVote(voter, {from: chairPersonAddress});
            await instance.vote(expectedWinningProposal, {from: voter});
        });

        let winningProposal = await instance.winningProposal.call();
        assert.equal(expectedWinningProposal, winningProposal.toNumber(), "The winning proposal is not the expected");
    });

});