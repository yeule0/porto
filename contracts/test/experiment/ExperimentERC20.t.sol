// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console2} from "forge-std/Test.sol";
import {stdJson} from "forge-std/StdJson.sol";
import {VmSafe} from "forge-std/Vm.sol";
import {ExperimentERC20} from "../../src/experiment/ExperimentERC20.sol";

contract ExperimentERC20Test is Test {
    ExperimentERC20 public experimentERC20;
    VmSafe.Wallet public wallet;

    function setUp() public {
        wallet = vm.createWallet("wallet");
        experimentERC20 = new ExperimentERC20(address(wallet.addr));
        vm.deal(address(experimentERC20), 100 ether);
    }

    function test_mint() public {
        vm.startBroadcast(address(wallet.addr));

        experimentERC20.mint(address(wallet.addr), 100);
        assertEq(experimentERC20.balanceOf(address(wallet.addr)), 100);

        vm.stopBroadcast();
    }

    function test_transfer(address to) public {
        vm.startBroadcast(address(wallet.addr));

        experimentERC20.mint(address(wallet.addr), 100);
        experimentERC20.transfer(address(to), 50);
        assertEq(experimentERC20.balanceOf(address(wallet.addr)), 50);
        assertEq(experimentERC20.balanceOf(address(to)), 50);

        vm.stopBroadcast();
    }

    function test_burnForEther() public {
        vm.startBroadcast(address(wallet.addr));

        experimentERC20.mint(address(wallet.addr), 10000);
        experimentERC20.burnForEther(1000);
        assertEq(address(wallet.addr).balance, 1);
        assertEq(experimentERC20.balanceOf(address(wallet.addr)), 9000);

        vm.stopBroadcast();
    }

    function test_mintForEther() public {
        vm.startBroadcast(address(wallet.addr));

        vm.deal(address(wallet.addr), 2 ether);
        experimentERC20.mintForEther{value: 1 ether}();
        assertEq(address(wallet.addr).balance, 1 ether);
        assertEq(
            experimentERC20.balanceOf(address(wallet.addr)),
            1000 * 1 ether
        );

        vm.stopBroadcast();
    }

    function test_mintForEther_revertUnauthorizedOrigin() public {
        vm.startBroadcast(address(this));

        vm.deal(address(wallet.addr), 2 ether);
        vm.expectRevert("unauthorized origin");
        experimentERC20.mintForEther{value: 1 ether}();

        vm.stopBroadcast();
    }
}
