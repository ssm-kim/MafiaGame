package com.mafia.domain.member.service;

import com.mafia.domain.member.model.dto.MemberDTO;
import com.mafia.domain.member.model.dto.response.MemberResponse;
import com.mafia.domain.member.model.dto.response.NicknameResponse;
import com.mafia.domain.member.model.entity.Member;
import com.mafia.domain.member.repository.MemberRepository;
import com.mafia.global.common.exception.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import static com.mafia.global.common.model.dto.BaseResponseStatus.MEMBER_NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

    private final MemberRepository memberRepository;

    //일정 회원 조회
    public MemberResponse getMemberInfo(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(MEMBER_NOT_FOUND));
        return MemberResponse.from(member);
    }

    @Transactional
    public NicknameResponse updateNickname(Long memberId, String nickname) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(MEMBER_NOT_FOUND));
        member.changeNickname(nickname);

        return new NicknameResponse(nickname);
    }
    // 전체 회원 조회
    public List<MemberDTO> getAllMembers() {
        return memberRepository.findAll()
                .stream()
                .map(MemberDTO::from)
                .collect(Collectors.toList());
    }
    // 회원 삭제
    @Transactional
    public void  updateStatusMember(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(MEMBER_NOT_FOUND));
        member.changeStatusToInActive();
    }
}
