from pyteal import *

def approval_program():

    # create 3 global states
    # OldNumber - holds an int value that represents the previous random number generated
    # Number - holds an int value that represents the most recent random number generated
    # OracleId - deployed oracle on testnet (https://developer.algorand.org/articles/usage-and-best-practices-for-randomness-beacon/) 
    handle_creation = Seq([
        App.globalPut(Bytes("OldNumber"), Int(0)),
        App.globalPut(Bytes("Number"), Int(0)),
        App.globalPut(Bytes("OracleId"), Btoi(Txn.application_args[0])),
        Return(Int(1))
    ])

    # storage vars for processing
    scratchNumber = ScratchVar(TealType.uint64)
    scratchReturn = ScratchVar(TealType.bytes)

    random_number = Seq([
        # store previous number in scratch space
        scratchNumber.store(App.globalGet(Bytes("Number"))),

        # store scratch space into global state
        App.globalPut(Bytes("OldNumber"), scratchNumber.load()),

        # build inner txn
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.MethodCall(

            # call the random oracle on testnet
            app_id=App.globalGet(Bytes("OracleId")),
            # abi method signature
            method_signature="get(uint64,byte[])byte[]",
            # provide args
            args=[Txn.application_args[1], Txn.application_args[2]],
        ),
        InnerTxnBuilder.Submit(),

        # based on arc-4 standards, return value is prefixed with 4 bytes (151f7c75) in hex, so we will remove it
        # this gives us the 32 byte result
        # https://pyteal.readthedocs.io/en/stable/abi.html#on-chain-in-an-inner-transaction
        scratchReturn.store(Suffix(InnerTxn.last_log(), Int(4))),

        # use extractuint64 to extract a uint64 from the first 8 bytes
        # to get a uint64 random output, you can change the offset to extract 8 bytes from anywhere within the 32 byte result
        # uint64 only requires 8 bytes
        App.globalPut(Bytes("Number"), ExtractUint64(scratchReturn.load(), Int(0))),
        Return(Int(1))
    ])

    handle_noop = Seq(
        Cond(
            [Txn.application_args[0] == Bytes("Random"), random_number]
        )
    )

    handle_optin = Return(Int(0))
    handle_closeout = Return(Int(0))
    handle_updateapp = Return(Int(0))
    handle_deleteapp = Return(Int(1))

    program = Cond(
        [Txn.application_id() == Int(0), handle_creation],
        [Txn.on_completion() == OnComplete.OptIn, handle_optin],
        [Txn.on_completion() == OnComplete.CloseOut, handle_closeout],
        [Txn.on_completion() == OnComplete.UpdateApplication, handle_updateapp],
        [Txn.on_completion() == OnComplete.DeleteApplication, handle_deleteapp],
        [Txn.on_completion() == OnComplete.NoOp, handle_noop]
    )

    return compileTeal(program, Mode.Application, version=6)

# print out the results
print(approval_program())