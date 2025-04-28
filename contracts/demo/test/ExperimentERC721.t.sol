// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console2} from "forge-std/Test.sol";
import {stdJson} from "forge-std/StdJson.sol";
import {VmSafe} from "forge-std/Vm.sol";

import {ExperimentERC721} from "../src/ExperimentERC721.sol";

contract ExperimentERC721Test is Test {
    ExperimentERC721 public nft;

    function setUp() public {
        nft = new ExperimentERC721("GEN", "Ithaca Genesis", "This is a description.", "https://example.com/image.png");
    }

    function test_mint() public {
        nft.mint();
        assertEq(nft.balanceOf(address(this)), 1);
        assertEq(nft.ownerOf(0), address(this));
        assertEq(
            nft.tokenURI(0),
            '{"name": "Ithaca Genesis #0", "description": "This is a description.", "image": "https://example.com/image.png"}'
        );

        nft.mint();
        assertEq(nft.balanceOf(address(this)), 2);
        assertEq(nft.ownerOf(1), address(this));
        assertEq(
            nft.tokenURI(1),
            '{"name": "Ithaca Genesis #1", "description": "This is a description.", "image": "https://example.com/image.png"}'
        );

        nft.mint(address(69));
        assertEq(nft.balanceOf(address(69)), 1);
        assertEq(nft.ownerOf(2), address(69));
    }
}
